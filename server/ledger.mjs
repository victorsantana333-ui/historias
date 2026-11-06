import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const final = new Set(['expired', 'canceled', 'refunded', 'error', 'depix_sent']);
function mergeStatus(previous, incoming) {
  if (previous === 'refunded') return previous;
  if (incoming === 'refunded') return incoming;
  if (previous === 'depix_sent') return previous;
  if (final.has(previous) && !final.has(incoming)) return previous;
  return incoming;
}
export function createLedger(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY, receipt TEXT NOT NULL, created INTEGER NOT NULL, event_time INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, received INTEGER NOT NULL,
      state TEXT NOT NULL DEFAULT 'pending', next_try INTEGER NOT NULL DEFAULT 0, tries INTEGER NOT NULL DEFAULT 0,
      reason TEXT
    );
    CREATE INDEX IF NOT EXISTS event_queue ON events(state, next_try);
    CREATE INDEX IF NOT EXISTS deposit_status ON deposits(json_extract(receipt,'$.status')); 
  `);
  const getRow = id => db.prepare('SELECT * FROM deposits WHERE id = ?').get(id);
  function get(id) { const row = getRow(id); return row ? JSON.parse(row.receipt) : null; }
  function save(data) {
    const previous = get(data.id);
    if (previous && previous.amountCents !== data.amountCents && data.amountCents !== undefined) throw new Error('Amount mismatch');
    const receipt = { ...previous, ...data, status: mergeStatus(previous?.status, data.status) };
    // Sandbox cannot become real through a webhook or a partial status response.
    if (previous?.sandbox) receipt.sandbox = true;
    db.prepare(`INSERT INTO deposits(id,receipt,created) VALUES(?,?,?)
      ON CONFLICT(id) DO UPDATE SET receipt=excluded.receipt`).run(data.id, JSON.stringify(receipt), Date.now());
    return receipt;
  }
  function enqueue(event) {
    return db.prepare('INSERT OR IGNORE INTO events(id,payload,received) VALUES(?,?,?)').run(event.id, JSON.stringify(event), Date.now()).changes > 0;
  }
  function drain(now = Date.now()) {
    const queued = db.prepare("SELECT * FROM events WHERE state='pending' AND next_try<=? ORDER BY received,id LIMIT 50").all(now);
    for (const row of queued) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const event = JSON.parse(row.payload);
        const payment = getRow(event.data.id);
        if (!payment) {
          const expired = now - row.received > 86400000;
          db.prepare('UPDATE events SET state=?, next_try=?, tries=tries+1, reason=? WHERE id=?')
            .run(expired ? 'ignored' : 'pending', now + Math.min(1000 * 2 ** Math.min(row.tries, 6), 60000), 'unknown_deposit', row.id);
        } else {
          const receipt = JSON.parse(payment.receipt);
          if (receipt.amountCents !== event.data.amountInCents) {
            db.prepare("UPDATE events SET state='failed',reason='amount_mismatch' WHERE id=?").run(row.id);
          } else {
            const eventTime = Date.parse(event.createdAt);
            if (eventTime >= payment.event_time || event.event === 'deposit.refunded') {
              const updated = { ...receipt, status: mergeStatus(receipt.status, event.data.status) };
              if (event.data.feeInCents !== undefined) updated.feeCents = event.data.feeInCents;
              if (event.data.netAmountInCents !== undefined) updated.netAmountCents = event.data.netAmountInCents;
              db.prepare('UPDATE deposits SET receipt=?,event_time=? WHERE id=?')
                .run(JSON.stringify(updated), Math.max(eventTime, payment.event_time), receipt.id);
            }
            db.prepare("UPDATE events SET state='processed',reason=NULL WHERE id=?").run(row.id);
          }
        }
        db.exec('COMMIT');
      } catch {
        db.exec('ROLLBACK');
        // Keep the durable event for the next worker pass, rather than losing it after acknowledgement.
        throw new Error('Não foi possível processar um evento de pagamento.');
      }
    }
  }
  function summary() {
    const predicate = "json_extract(receipt,'$.status')='depix_sent' AND coalesce(json_extract(receipt,'$.sandbox'),0)=0";
    const totals = db.prepare(`SELECT coalesce(sum(json_extract(receipt,'$.amountCents')),0) AS amountCents, count(*) AS count FROM deposits WHERE ${predicate}`).get();
    const recent = db.prepare(`SELECT receipt,created FROM deposits WHERE ${predicate} ORDER BY created DESC LIMIT 20`).all()
      .map(row => ({ amountCents: JSON.parse(row.receipt).amountCents, createdAt: new Date(row.created).toISOString() }));
    return { ...totals, recent };
  }
  return { get, save, enqueue, drain, summary, close: () => db.close(), event: id => db.prepare('SELECT state,reason FROM events WHERE id=?').get(id) };
}

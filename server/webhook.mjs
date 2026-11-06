import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
const supported = new Set(['deposit.approved', 'deposit.completed', 'deposit.expired', 'deposit.refunded']);
export function verifySignature(raw, header, secret, now = Date.now()) {
  if (!secret || typeof header !== 'string' || !Buffer.isBuffer(raw)) return false;
  const parts = header.split(',').map(s => s.trim().split('='));
  if (parts.length !== 2 || parts.some(p => p.length !== 2) || new Set(parts.map(p => p[0])).size !== 2) return false;
  const fields = Object.fromEntries(parts);
  if (!/^\d{1,12}$/.test(fields.t || '') || !/^[a-fA-F0-9]{64}$/.test(fields.v1 || '')) return false;
  if (Math.abs(now / 1000 - Number(fields.t)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${fields.t}.`).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(fields.v1, 'hex'));
}
export function mountWebhook(app, { ledger, env, schedule }) {
  // Mount before express.json and the browser Origin check: signature covers exact raw bytes.
  app.post('/api/webhooks/deflow', express.raw({ type: 'application/json', limit: '64kb', inflate: false }), (req,res,next) => {
    try {
      res.set('Cache-Control', 'no-store');
      if (!env.DEFLOW_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook não configurado.' });
      if (!verifySignature(req.body, req.get('DF-Signature'), env.DEFLOW_WEBHOOK_SECRET)) return res.status(401).json({ error: 'Assinatura inválida ou expirada.' });
      let event;
      try { event = JSON.parse(req.body.toString('utf8')); } catch { return res.status(400).json({ error: 'JSON inválido.' }); }
      if (!event || typeof event.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(event.id) || req.get('DF-Event-Id') !== event.id) return res.status(400).json({ error: 'Identificador de evento inválido.' });
      // A key may have other subscriptions. Unused event types do not mutate donation records.
      if (!supported.has(event.event)) return res.status(200).json({ received: true, ignored: true });
      const data = event.data;
      const time = Date.parse(event.createdAt);
      if (typeof event.createdAt !== 'string' || !Number.isFinite(time) || time > Date.now() + 300000 || !data || !/^[a-zA-Z0-9_-]{1,128}$/.test(data.id || '') || !/^[a-z_]{1,64}$/.test(data.status || '') || !Number.isSafeInteger(data.amountInCents) || data.amountInCents <= 0) return res.status(400).json({ error: 'Dados de evento inválidos.' });
      const expected = { 'deposit.completed': 'depix_sent', 'deposit.refunded': 'refunded', 'deposit.expired': 'expired' }[event.event];
      if ((expected && data.status !== expected) || (event.event === 'deposit.approved' && ['depix_sent','expired','canceled','refunded','error'].includes(data.status))) return res.status(400).json({ error: 'Status inconsistente com o evento.' });
      for (const field of ['feeInCents','netAmountInCents']) if (data[field] !== undefined && (!Number.isSafeInteger(data[field]) || data[field] < 0 || data[field] > data.amountInCents)) return res.status(400).json({ error: 'Valores de evento inválidos.' });
      // Persist only the normalized financial data needed here, never the raw payload or taxpayer data.
      const normalized = { id: event.id, event: event.event, createdAt: event.createdAt, data: Object.fromEntries(['id','status','amountInCents','feeInCents','netAmountInCents'].filter(k => data[k] !== undefined).map(k => [k,data[k]])) };
      const inserted = ledger.enqueue(normalized);
      // Durable acknowledgement first; queue processing runs after the response and on server startup.
      res.status(202).json({ received: true, duplicate: !inserted });
      schedule();
    } catch (error) { next(error); }
  });
}

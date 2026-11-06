import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.mjs';
const env = { APP_ORIGIN: 'http://localhost:3000', DEFLOW_API_KEY: 'test-key', DEFLOW_API_SECRET: 'test-secret', PAYMENT_SIGNING_SECRET: 's'.repeat(64), DEFLOW_WALLET_ID: '69aefab9349f3138e50ce00a' };
async function fixture(t, fetchImpl, config = env) {
  const app = createApp({ env: { ...config, DATABASE_PATH: ':memory:' }, fetchImpl });
  const server = app.listen(0, '127.0.0.1');
  t.after(() => app.locals.close());
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}
const options = (body, key = '9b2f8b6e-7a2c-4f51-8a1f-0c1d3e2b9aaf') => ({ method: 'POST', headers: { Origin: env.APP_ORIGIN, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(body) });
const donation = { amountInCents: 5000, payerTaxNumber: '123.456.789-09', walletId: 'attacker-wallet' };
test('creates exact payer amount, pins wallet server-side, protects status and forwards idempotency', async t => {
  const calls = [];
  const base = await fixture(t, async (url, init) => {
    calls.push({ url, init });
    const data = url.includes('deposit-status') ? { id: 'deposit_1', status: 'depix_sent', amountCents: 5000, walletId: 'private-wallet', txId: 'private-tx' } : { id: 'deposit_1', status: 'pending', amountCents: 5000, qrCopyPaste: '000201-Pix', expiresAt: '2026-12-01T12:00:00Z', feeCents: 349, netAmountCents: 4651 };
    return Response.json({ data });
  });
  const response = await fetch(`${base}/api/donations`, options(donation));
  assert.equal(response.status, 201);
  const data = await response.json();
  assert.equal(data.qrCopyPaste, '000201-Pix');
  assert.equal(data.amountCents, 5000);
  assert.equal(calls[0].url, 'https://api.deflow.exchange/v1/deposit/create');
  assert.equal(calls[0].init.headers['X-DF-Idempotency-Key'], options(donation).headers['Idempotency-Key']);
  assert.deepEqual(JSON.parse(calls[0].init.body), { amountInCents: 5000, payerTaxNumber: '12345678909', walletId: env.DEFLOW_WALLET_ID });
  assert.equal((await fetch(`${base}/api/donations/deposit_1`)).status, 403);
  assert.equal((await fetch(`${base}/api/donations/another`, { headers: { Authorization: `Bearer ${data.accessToken}` } })).status, 403);
  assert.equal((await fetch(`${base}/api/donations/deposit_1`, { headers: { Authorization: `Bearer ${data.accessToken}x` } })).status, 403);
  const status = await fetch(`${base}/api/donations/deposit_1`, { headers: { Authorization: `Bearer ${data.accessToken}` } });
  const verified = await status.json();
  assert.equal(verified.id, 'deposit_1'); assert.equal(verified.status, 'depix_sent'); assert.equal(verified.amountCents, 5000);
  assert.equal(verified.walletId, undefined);
  await fetch(`${base}/api/donations/deposit_1`, { headers: { Authorization: `Bearer ${data.accessToken}` } });
  assert.equal(calls.length, 2, 'status cache reduces provider requests');
});
test('rejects invalid amounts, missing document, bad idempotency and cross-site requests before provider calls', async t => {
  let calls = 0;
  const base = await fixture(t, async () => { calls++; throw new Error('must not call'); });
  for (const amountInCents of [0, 499, 600001, 500.5, '5000']) {
    assert.equal((await fetch(`${base}/api/donations`, options({ ...donation, amountInCents }))).status, 400);
  }
  assert.equal((await fetch(`${base}/api/donations`, options({ amountInCents: 5000 }))).status, 400);
  assert.equal((await fetch(`${base}/api/donations`, options(donation, 'bad-key'))).status, 400);
  const crossSite = options(donation); crossSite.headers.Origin = 'https://other.example';
  assert.equal((await fetch(`${base}/api/donations`, crossSite)).status, 403);
  assert.equal(calls, 0);
});
test('quotes use net mode and actual provider fees, without client calculations', async t => {
  const base = await fixture(t, async url => {
    assert.match(url, /amountCents=5000&mode=net$/);
    return Response.json({ data: { amountCents: 5000, totalFeeCents: 349, netAmountCents: 4651, effectiveFeePercent: '3.50', internal: 'hidden' } });
  });
  const result = await fetch(`${base}/api/donations/quote?amountCents=5000`);
  assert.deepEqual(await result.json(), { amountCents: 5000, totalFeeCents: 349, netAmountCents: 4651, effectiveFeePercent: '3.50' });
});
test('maps duplicate and provider failures without leaking credentials or provider internals', async t => {
  const base = await fixture(t, async () => Response.json({ error: { code: 'DUPLICATE_AMOUNT_RECENT', message: 'private' } }, { status: 422 }));
  const result = await fetch(`${base}/api/donations`, options(donation));
  assert.equal(result.status, 422);
  assert.match((await result.json()).error, /30 minutos/);
  const unavailable = await fixture(t, async () => { throw new Error('test-secret'); });
  const failed = await fetch(`${unavailable}/api/donations`, options(donation));
  assert.equal(failed.status, 502);
  assert.doesNotMatch(JSON.stringify(await failed.json()), /test-secret/);
});
test('no credentials means no provider request; sandbox remains explicitly flagged', async t => {
  const empty = await fixture(t, async () => { throw new Error('must not call'); }, {});
  assert.equal((await fetch(`${empty}/api/donations/quote?amountCents=5000`)).status, 503);
  const sandbox = await fixture(t, async () => Response.json({ data: { id: 'sandbox_1', status: 'pending', qrCopyPaste: 'sandbox-only', sandbox: true } }));
  const response = await fetch(`${sandbox}/api/donations`, options(donation));
  const body = await response.json();
  assert.equal(body.sandbox, true);
  assert.equal(body.amountCents, 5000);
});

test('rejects a mismatched amount from the provider instead of displaying the wrong charge', async t => {
  const base = await fixture(t, async () => Response.json({ data: { id: 'wrong_amount', status: 'pending', amountCents: 6000, qrCopyPaste: 'wrong' } }));
  const result = await fetch(`${base}/api/donations`, options(donation));
  assert.equal(result.status, 502);
  assert.match((await result.json()).error, /valor diferente/);
});

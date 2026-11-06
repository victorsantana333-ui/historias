import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function createApp({ env = process.env, fetchImpl = fetch } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4kb' }));
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    // Reject cross-site mutations. Production must use the public HTTPS origin.
    if (req.method === 'POST' && req.headers.origin !== env.APP_ORIGIN) {
      return res.status(403).json({ error: 'Origem não autorizada.' });
    }
    next();
  });
  const limits = new Map();
  const cache = new Map();
  function ready() {
    if (!env.DEFLOW_API_KEY || !env.DEFLOW_API_SECRET || !env.PAYMENT_SIGNING_SECRET || env.PAYMENT_SIGNING_SECRET.length < 32 || !env.APP_ORIGIN) {
      throw new ApiError(503, 'Recebimento de doações ainda não configurado. Tente novamente mais tarde.');
    }
  }
  function allow(name, count, windowMs) {
    const now = Date.now();
    const recent = (limits.get(name) || []).filter(t => t > now - windowMs);
    if (recent.length >= count) throw new ApiError(429, 'Muitas solicitações. Aguarde um pouco antes de tentar novamente.');
    limits.set(name, [...recent, now]);
  }
  const sign = value => createHmac('sha256', env.PAYMENT_SIGNING_SECRET).update(value).digest('base64url');
  function capability(id) {
    const payload = Buffer.from(JSON.stringify({ id, exp: Date.now() + 7 * 86400000 })).toString('base64url');
    return `${payload}.${sign(payload)}`;
  }
  function verify(token, id) {
    try {
      const [payload, signature, extra] = token.split('.');
      const expected = Buffer.from(sign(payload));
      const received = Buffer.from(signature || '');
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (extra || expected.length !== received.length || !timingSafeEqual(expected, received) || data.id !== id || data.exp < Date.now()) throw new Error();
    } catch { throw new ApiError(403, 'Acesso à cobrança inválido ou expirado.'); }
  }
  function amount(value) {
    if (!Number.isSafeInteger(value) || value < 500 || value > 600000) throw new ApiError(400, 'Informe um valor entre R$ 5,00 e R$ 6.000,00.');
    return value;
  }
  async function upstream(path, options = {}) {
    const response = await fetchImpl(`https://api.deflow.exchange${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${env.DEFLOW_API_KEY}`, 'X-DF-Secret': env.DEFLOW_API_SECRET, 'Content-Type': 'application/json', ...options.headers },
      signal: AbortSignal.timeout(60000),
    });
    let body;
    try { body = await response.json(); } catch { throw new ApiError(502, 'Não foi possível interpretar a resposta do pagamento. Tente novamente.'); }
    if (!response.ok) {
      const code = body.error?.code;
      const messages = {
        FIRST_DEPOSIT_CAP: 'A primeira cobrança da conta está limitada a R$ 30,00 pela DeFlow.',
        DUPLICATE_AMOUNT_RECENT: 'Já existe uma cobrança desse valor para este CPF/CNPJ nos últimos 30 minutos. Retome a cobrança anterior ou aguarde.',
        IDEMPOTENCY_CONFLICT: 'Esta tentativa já está vinculada a outros dados. Retome a cobrança anterior.',
        MISSING_SCOPE: 'O recebimento está sem a permissão necessária na DeFlow. Avise o responsável pela campanha.',
      };
      const message = messages[code] || (response.status === 400 ? 'A DeFlow não pôde criar a cobrança. Confira o CPF/CNPJ e os dados informados.' : response.status === 429 ? 'Aguarde um pouco antes de consultar ou gerar outro Pix.' : 'A DeFlow está indisponível ou não autorizou esta operação. Tente novamente mais tarde.');
      throw new ApiError([400,403,409,422,429,503].includes(response.status) ? response.status : 502, message);
    }
    if (!body.data) throw new ApiError(502, 'Resposta incompleta do serviço de pagamento.');
    return body.data;
  }
  const wrap = fn => (req, res, next) => Promise.resolve().then(() => { ready(); return fn(req, res); }).catch(next);
  const safe = data => Object.fromEntries(['id','status','qrCopyPaste','expiresAt','amountCents','feeCents','netAmountCents','sandbox'].filter(k => data[k] !== undefined).map(k => [k, data[k]]));

  app.get('/api/donations/quote', wrap(async (req, res) => {
    const cents = amount(Number(req.query.amountCents));
    const key = `quote:${cents}`;
    let entry = cache.get(key);
    if (!entry || entry.until < Date.now()) {
      allow('quote-minute', 25, 60000); allow('quote-burst', 4, 5000);
      const data = await upstream(`/v1/depix/quote?amountCents=${cents}&mode=net`);
      entry = { data: { amountCents: data.amountCents, netAmountCents: data.netAmountCents, totalFeeCents: data.totalFeeCents, effectiveFeePercent: data.effectiveFeePercent }, until: Date.now() + 30000 };
      cache.set(key, entry);
    }
    res.json(entry.data);
  }));
  app.post('/api/donations', wrap(async (req, res) => {
    const amountInCents = amount(req.body?.amountInCents);
    const payerTaxNumber = String(req.body?.payerTaxNumber || '').replace(/\D/g, '');
    if (!/^(\d{11}|\d{14})$/.test(payerTaxNumber)) throw new ApiError(400, 'Informe o CPF ou CNPJ do pagador.');
    const key = req.get('Idempotency-Key') || '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw new ApiError(400, 'Identificador da tentativa inválido.');
    allow('create-minute', 12, 60000); allow('create-burst', 4, 5000);
    const body = { amountInCents, payerTaxNumber };
    if (env.DEFLOW_WALLET_ID) body.walletId = env.DEFLOW_WALLET_ID;
    const data = await upstream('/v1/deposit/create', { method: 'POST', headers: { 'X-DF-Idempotency-Key': key }, body: JSON.stringify(body) });
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(data.id) || !data.qrCopyPaste) throw new ApiError(502, 'Cobrança sem dados suficientes. Tente novamente com a mesma tentativa.');
    if (data.amountCents !== undefined && data.amountCents !== amountInCents) throw new ApiError(502, 'A DeFlow retornou um valor diferente. Retome esta tentativa antes de gerar outra cobrança.');
    res.status(201).json({ ...safe(data), amountCents: data.amountCents ?? amountInCents, accessToken: capability(data.id) });
  }));
  app.get('/api/donations/:id', wrap(async (req, res) => {
    const { id } = req.params;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new ApiError(400, 'Cobrança inválida.');
    verify((req.get('Authorization') || '').replace(/^Bearer /, ''), id);
    const key = `status:${id}`;
    let entry = cache.get(key);
    if (!entry || entry.until < Date.now()) {
      allow('status-minute', 50, 60000); allow('status-burst', 8, 5000);
      const data = await upstream(`/v1/deposit-status/${encodeURIComponent(id)}`);
      if (data.id !== id) throw new ApiError(502, 'Resposta de cobrança inconsistente.');
      entry = { data: safe(data), until: Date.now() + 15000 };
      cache.set(key, entry);
    }
    res.json(entry.data);
  }));
  // Bound memory use; cache is an optimization, not a payment ledger.
  const cleaner = setInterval(() => { for (const [key, value] of cache) if (value.until < Date.now()) cache.delete(key); }, 60000);
  cleaner.unref();
  app.use('/api', (err, req, res, next) => {
    const status = err.status || (err.name === 'TimeoutError' ? 503 : 502);
    res.status(status).json({ error: err instanceof ApiError ? err.message : 'Não foi possível consultar o pagamento. Tente novamente com a mesma tentativa.' });
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  return app;
}

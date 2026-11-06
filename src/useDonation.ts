import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

type Payment = { id: string; status: string; accessToken: string; amountCents: number; qrCopyPaste?: string; expiresAt?: string; sandbox?: boolean; feeCents?: number; netAmountCents?: number };
type Quote = { amountCents: number; totalFeeCents: number; netAmountCents: number; effectiveFeePercent: string };
const storageKey = 'deflow-donation-v1';
function readSaved(): Payment | null {
  try { const data = JSON.parse(localStorage.getItem(storageKey) || 'null'); return data?.id && data?.accessToken ? { ...data, status: 'pending' } : null; } catch { return null; }
}
async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, signal: AbortSignal.timeout(65000) });
  const body = await response.json();
  if (!response.ok) throw Object.assign(new Error(body.error || 'Não foi possível consultar a DeFlow.'), { status: response.status });
  return body;
}
export const money = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const terminal = new Set(['depix_sent', 'expired', 'canceled', 'refunded', 'error']);
export function useDonation(amountCents: number, quoting: boolean) {
  const [payment, setPayment] = useState<Payment | null>(readSaved);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [quoteError, setQuoteError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const busy = useRef(false);
  const paid = payment?.status === 'depix_sent' && !payment?.sandbox;
  useEffect(() => {
    if (!quoting || payment) return;
    let active = true;
    setQuote(null); setQuoteError('');
    const timer = setTimeout(() => api(`/api/donations/quote?amountCents=${amountCents}`)
      .then(data => { if (active) setQuote(data); })
      .catch(e => { if (active) setQuoteError(e.message); }), 400);
    return () => { active = false; clearTimeout(timer); };
  }, [amountCents, quoting, payment]);
  useEffect(() => {
    let active = true;
    setQrImage('');
    if (payment?.qrCopyPaste) QRCode.toDataURL(payment.qrCopyPaste, { width: 280, margin: 2 })
      .then(url => { if (active) setQrImage(url); }).catch(() => {});
    return () => { active = false; };
  }, [payment?.qrCopyPaste]);
  useEffect(() => {
    if (!payment?.id || terminal.has(payment.status)) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let attempt = 0;
    const poll = async () => {
      try {
        const data = await api(`/api/donations/${payment.id}`, { headers: { Authorization: `Bearer ${payment.accessToken}` } });
        if (!active) return;
        setPayment(previous => previous ? { ...previous, ...data } : previous);
        setError('');
        if (terminal.has(data.status)) return;
      } catch (e) { if (active) setError((e as Error).message); }
      if (active) timer = setTimeout(poll, Math.min(15000 + attempt++ * 3000, 60000));
    };
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [payment?.id, payment?.accessToken, payment?.status]);
  useEffect(() => {
    try {
      if (payment) {
        // Store only the receipt capability, never CPF/CNPJ, name or phone.
        const { id, accessToken, amountCents, status, sandbox } = payment;
        localStorage.setItem(storageKey, JSON.stringify({ id, accessToken, amountCents, status, sandbox }));
      } else localStorage.removeItem(storageKey);
    } catch { /* The current page still works if storage is unavailable. */ }
  }, [payment]);
  async function create(taxNumber: string) {
    if (busy.current || payment) return;
    busy.current = true; setLoading(true); setError('');
    try {
      const payerTaxNumber = taxNumber.replace(/\D/g, '');
      if (!/^(\d{11}|\d{14})$/.test(payerTaxNumber)) throw new Error('Informe o CPF ou CNPJ do pagador.');
      // Hash binds retries to the original body without storing the document.
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${amountCents}:${payerTaxNumber}`));
      const fingerprint = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
      let saved = JSON.parse(localStorage.getItem(`${storageKey}-attempt`) || 'null');
      if (saved && saved.fingerprint !== fingerprint) throw new Error('Há uma tentativa anterior sem resposta conclusiva. Use o mesmo valor e CPF/CNPJ para retomá-la antes de gerar outra cobrança.');
      if (!saved) {
        saved = { key: crypto.randomUUID(), fingerprint };
        localStorage.setItem(`${storageKey}-attempt`, JSON.stringify(saved));
      }
      let data;
      try {
        data = await api('/api/donations', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': saved.key }, body: JSON.stringify({ amountInCents: amountCents, payerTaxNumber }) });
      } catch (e) {
        // Validation/blocked/duplicate errors explicitly create no charge. Ambiguous failures keep the key.
        if ([400, 403, 422].includes((e as {status?: number}).status || 0)) localStorage.removeItem(`${storageKey}-attempt`);
        throw e;
      }
      // Persist before removing the retry key.
      localStorage.setItem(storageKey, JSON.stringify({ id: data.id, status: data.status, amountCents: data.amountCents, accessToken: data.accessToken, sandbox: data.sandbox }));
      setPayment(data); localStorage.removeItem(`${storageKey}-attempt`);
    } catch (e) { setError((e as Error).message || 'Falha ao gerar Pix. Tente novamente com os mesmos dados.'); }
    finally { busy.current = false; setLoading(false); }
  }
  function clear() {
    if (!payment || !terminal.has(payment.status)) return;
    setPayment(null); setError('');
  }
  return { payment, quote: quote?.amountCents === amountCents ? quote : null, quoteError, error, loading, qrImage, paid, create, clear, terminal: !!payment && terminal.has(payment.status) };
}

import { useEffect, useState } from 'react';
import { money } from './useDonation';
type Campaign = { amountCents: number; count: number; recent: { amountCents: number; createdAt: string }[] };
export function useCampaign() {
  const [data, setData] = useState<Campaign | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const res = await fetch('/api/campaign', { signal: AbortSignal.timeout(10000) });
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) throw new Error();
        const data = await res.json();
        if (!active) return;
        setData(data); setError('');
      } catch { if (active) setError('Não foi possível atualizar os totais agora.'); }
      if (active) timer = setTimeout(load, 30000);
    };
    load();
    return () => { active = false; clearTimeout(timer); };
  }, []);
  return {
    raisedAmount: data ? data.amountCents / 100 : 0,
    supporterCount: data?.count || 0,
    supporters: (data?.recent || []).map(p => ({ name: 'Anônimo', value: money(p.amountCents), time: new Date(p.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Bahia' }) })),
    notice: error || (data ? 'Doações confirmadas por esta integração. Total bruto antes das taxas; cada contribuição conta como uma doação.' : 'Carregando doações confirmadas…'),
  };
}

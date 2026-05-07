import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export function CryptoTicker() {
  const { cryptoPrices, setCryptoPrices } = useStore();
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const ids = 'bitcoin,ethereum,the-open-network,solana,binancecoin';
        const res = await window.fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        if (!res.ok) return;
        const data = await res.json();
        const prices: Record<string, number> = {};
        Object.entries(data).forEach(([k, v]: [string, any]) => {
          prices[k] = v.usd;
          prices[`${k}_change`] = v.usd_24h_change ?? 0;
        });
        prevPrices.current = cryptoPrices;
        setCryptoPrices(prices);
      } catch {}
    };
    fetch();
    const t = setInterval(fetch, 60000);
    return () => clearInterval(t);
  }, []);

  const items = [
    { symbol: 'BTC', price: cryptoPrices['bitcoin'], change: cryptoPrices['bitcoin_change'] },
    { symbol: 'ETH', price: cryptoPrices['ethereum'], change: cryptoPrices['ethereum_change'] },
    { symbol: 'TON', price: cryptoPrices['the-open-network'], change: cryptoPrices['the-open-network_change'] },
    { symbol: 'SOL', price: cryptoPrices['solana'], change: cryptoPrices['solana_change'] },
    { symbol: 'BNB', price: cryptoPrices['binancecoin'], change: cryptoPrices['binancecoin_change'] },
  ].filter(i => i.price);

  if (!items.length) {
    return (
      <div className="h-8 glass flex items-center px-4">
        <span className="text-[10px] text-white/30 animate-pulse-glow">Загрузка котировок...</span>
      </div>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div className="h-8 glass border-b border-white/5 flex items-center overflow-hidden ticker-wrap">
      <div className="animate-ticker flex gap-8 px-4 whitespace-nowrap">
        {doubled.map((item, i) => {
          const pos = (item.change ?? 0) >= 0;
          return (
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] font-medium">
              <span className="text-white/50">{item.symbol}</span>
              <span className="text-white font-bold">${item.price?.toLocaleString('en', { maximumFractionDigits: item.price > 100 ? 0 : 4 })}</span>
              <span className={pos ? 'text-emerald-400' : 'text-red-400'}>
                {pos ? '▲' : '▼'} {Math.abs(item.change ?? 0).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

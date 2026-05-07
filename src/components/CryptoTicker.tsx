import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

const SYMBOLS = [
  { id: 'bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'the-open-network', symbol: 'TON', icon: '💎' },
  { id: 'solana', symbol: 'SOL', icon: '◎' },
  { id: 'binancecoin', symbol: 'BNB', icon: '⬡' },
  { id: 'notcoin', symbol: 'NOT', icon: '🔔' },
];

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString('en', { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
}

export function CryptoTicker() {
  const { cryptoPrices, setCryptoPrices } = useStore();
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = SYMBOLS.map((s) => s.id).join(',');
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const prices: Record<string, { usd: number; usd_24h_change: number }> = {};
        for (const [k, v] of Object.entries(data)) {
          const val = v as { usd: number; usd_24h_change: number };
          prices[k] = { usd: val.usd, usd_24h_change: val.usd_24h_change ?? 0 };
        }
        setCryptoPrices(prices);
        setError(false);
      } catch {
        setError(true);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [setCryptoPrices]);

  const items = SYMBOLS.map((s) => ({
    ...s,
    price: cryptoPrices[s.id]?.usd ?? 0,
    change: cryptoPrices[s.id]?.usd_24h_change ?? 0,
  })).filter((s) => s.price > 0);

  if (items.length === 0) {
    return (
      <div className="h-8 flex items-center px-4 overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-[10px] text-white/20 animate-pulse">
          {error ? '⚠️ Нет соединения с оракулом цен' : '🔄 Загрузка цен...'}
        </span>
      </div>
    );
  }

  return (
    <div className="h-8 flex items-center overflow-hidden relative"
      style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex animate-ticker whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 px-4">
            <span className="text-[10px] text-white/40 font-mono">{item.icon}</span>
            <span className="text-[10px] font-bold text-white/70">{item.symbol}</span>
            <span className="text-[10px] font-mono text-white/90">{formatPrice(item.price)}</span>
            <span className={`text-[9px] font-bold ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      {/* Live indicator */}
      <div className="absolute right-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-glow" />
        <span className="text-[9px] text-emerald-400 font-bold">LIVE</span>
      </div>
    </div>
  );
}

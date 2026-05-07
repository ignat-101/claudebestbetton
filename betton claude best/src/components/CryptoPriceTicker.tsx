import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const SYMBOLS = 'bitcoin,ethereum,the-open-network,solana,binancecoin';

const SYMBOL_LABELS: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  'the-open-network': 'TON',
  solana: 'SOL',
  binancecoin: 'BNB',
};

export function CryptoPriceTicker() {
  const { cryptoPrices, setCryptoPrices } = useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${SYMBOLS}&vs_currencies=usd&include_24hr_change=true`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        setCryptoPrices(data);
      }
    } catch {
      // silently fail, use cached
    }
  };

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const entries = Object.entries(cryptoPrices);
  if (entries.length === 0) return null;

  return (
    <div className="flex-shrink-0 overflow-hidden" style={{ height: '32px', background: 'rgba(5,5,20,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center h-full gap-4 px-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {entries.map(([id, data]) => {
          const label = SYMBOL_LABELS[id] || id.toUpperCase();
          const price = data.usd;
          const change = data.usd_24h_change ?? 0;
          const isPositive = change >= 0;
          return (
            <div key={id} className="flex items-center gap-1.5 flex-shrink-0">
              {id === 'the-open-network' && (
                <span className="text-[#0098EA] text-xs">💎</span>
              )}
              <span className="text-[11px] font-bold text-white/60">{label}</span>
              <span className="text-[11px] font-semibold text-white">
                ${price >= 1 ? price.toLocaleString('en', { maximumFractionDigits: 2 }) : price.toFixed(4)}
              </span>
              <span className={`text-[10px] font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

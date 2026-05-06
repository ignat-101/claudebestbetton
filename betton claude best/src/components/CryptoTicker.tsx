import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const MOCK_PRICES: TickerItem[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 107842, change: 2.4 },
  { symbol: 'ETH', name: 'Ethereum', price: 3847, change: -1.2 },
  { symbol: 'TON', name: 'TON', price: 6.84, change: 5.7 },
  { symbol: 'SOL', name: 'Solana', price: 198.3, change: 3.1 },
  { symbol: 'BNB', name: 'BNB', price: 687, change: 0.8 },
  { symbol: 'XRP', name: 'XRP', price: 2.43, change: -0.5 },
];

export function CryptoTicker() {
  const [prices, setPrices] = useState<TickerItem[]>(MOCK_PRICES);
  const setCryptoPrices = useStore((s) => s.setCryptoPrices);

  useEffect(() => {
    // Simulate price updates
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((p) => ({
          ...p,
          price: p.price * (1 + (Math.random() - 0.5) * 0.002),
          change: p.change + (Math.random() - 0.5) * 0.3,
        }))
      );
    }, 3000);

    // Try to fetch real prices
    const fetchPrices = async () => {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,the-open-network,solana,binancecoin,ripple&vs_currencies=usd&include_24hr_change=true',
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          const mapped: Record<string, { price: number; change24h: number; symbol: string }> = {
            bitcoin: { price: data.bitcoin?.usd || 107842, change24h: data.bitcoin?.usd_24h_change || 0, symbol: 'BTC' },
            ethereum: { price: data.ethereum?.usd || 3847, change24h: data.ethereum?.usd_24h_change || 0, symbol: 'ETH' },
            'the-open-network': { price: data['the-open-network']?.usd || 6.84, change24h: data['the-open-network']?.usd_24h_change || 0, symbol: 'TON' },
            solana: { price: data.solana?.usd || 198.3, change24h: data.solana?.usd_24h_change || 0, symbol: 'SOL' },
          };
          setCryptoPrices(mapped);
          setPrices([
            { symbol: 'BTC', name: 'Bitcoin', price: mapped.bitcoin?.price || 107842, change: mapped.bitcoin?.change24h || 0 },
            { symbol: 'ETH', name: 'Ethereum', price: mapped.ethereum?.price || 3847, change: mapped.ethereum?.change24h || 0 },
            { symbol: 'TON', name: 'TON', price: mapped['the-open-network']?.price || 6.84, change: mapped['the-open-network']?.change24h || 0 },
            { symbol: 'SOL', name: 'Solana', price: mapped.solana?.price || 198.3, change: mapped.solana?.change24h || 0 },
            { symbol: 'BNB', name: 'BNB', price: 687, change: 0.8 },
            { symbol: 'XRP', name: 'XRP', price: 2.43, change: -0.5 },
          ]);
        }
      } catch {
        // Use mock data
      }
    };

    fetchPrices();
    return () => clearInterval(interval);
  }, [setCryptoPrices]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  return (
    <div className="relative overflow-hidden" style={{ height: '32px' }}>
      <div className="flex gap-6 animate-ticker" style={{
        display: 'flex',
        gap: '32px',
        animation: 'ticker 30s linear infinite',
        whiteSpace: 'nowrap',
      }}>
        {[...prices, ...prices].map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-xs font-medium">
            <span className="text-purple-400 font-bold">{item.symbol}</span>
            <span className="text-white/80">{formatPrice(item.price)}</span>
            <span className={item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

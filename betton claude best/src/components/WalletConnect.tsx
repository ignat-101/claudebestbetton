import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

// Simulated wallet connect (TonConnect-style)
export function WalletConnect() {
  const { tonWalletAddress, setTonWalletAddress, currentUser } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleConnect = () => {
    // Simulate wallet connection - generate a TON-like address
    const chars = '0123456789ABCDEFabcdef';
    const addr = 'UQ' + Array.from({ length: 46 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setTonWalletAddress(addr);
    setOpen(false);
  };

  const handleDisconnect = () => {
    setTonWalletAddress(null);
    setOpen(false);
  };

  if (!tonWalletAddress) {
    return (
      <button
        onClick={handleConnect}
        className="btn-primary"
        style={{ padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span>💎</span>
        <span>Подключить</span>
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#60a5fa',
        }}
      >
        <span style={{ fontSize: 16 }}>{currentUser?.avatarEmoji ?? '💎'}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {tonWalletAddress.slice(0, 4)}…{tonWalletAddress.slice(-4)}
        </span>
        <span style={{ fontSize: 10, color: '#64748b' }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4,
          background: '#181c27', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, padding: 8, minWidth: 180, zIndex: 100,
        }}>
          <div style={{ padding: '6px 8px', fontSize: 11, color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
            {currentUser?.username}
          </div>
          <div style={{ padding: '6px 8px', fontSize: 12, color: '#94a3b8', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>⚡</span>
            <span>Репутация: {currentUser?.reputation ?? 0}</span>
          </div>
          <div style={{ padding: '6px 8px', fontSize: 12, color: '#94a3b8', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>🗳️</span>
            <span>Стейк: {(currentUser?.stakedAmount ?? 0).toFixed(2)} TON</span>
          </div>
          <button
            onClick={handleDisconnect}
            style={{
              width: '100%', padding: '7px 8px', marginTop: 4,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 6, color: '#ef4444', fontSize: 12, cursor: 'pointer', textAlign: 'left',
            }}
          >
            🔌 Отключить кошелёк
          </button>
        </div>
      )}
    </div>
  );
}

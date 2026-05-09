import { TonConnectButton, useTonAddress } from '@tonconnect/ui-react';
import { useBettingStore } from '../store/bettingStore';
import { Zap } from 'lucide-react';

export function Header() {
  const address = useTonAddress();
  const { tonBalance, isLoadingBalance } = useBettingStore();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Bett<span className="text-blue-400">on</span>
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {address && (
            <div className="glass-card-sm px-3 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-mono">
                {shortAddress}
              </span>
              {isLoadingBalance ? (
                <span className="text-xs text-slate-400 animate-pulse">...</span>
              ) : (
                <span className="text-xs text-blue-300 font-semibold">
                  {tonBalance.toFixed(2)} TON
                </span>
              )}
            </div>
          )}
          <TonConnectButton />
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useBettingStore } from '../store/bettingStore';
import { useTonBalance } from '../hooks/useTonBalance';
import { useTonTransactions } from '../hooks/useTonTransactions';
import { ExternalLink, RefreshCw, LogOut, Copy, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function WalletTab() {
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { tonBalance, isLoadingBalance, transactions } = useBettingStore();
  const { fetchBalance } = useTonBalance();
  const { withdraw } = useTonTransactions();

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Enter a valid amount');
      return;
    }
    if (amount > tonBalance) {
      setWithdrawError('Insufficient balance');
      return;
    }
    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      await withdraw(amount);
      setWithdrawAmount('');
    } catch {
      setWithdrawError('Withdrawal failed. Try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/20 flex items-center justify-center">
          <span className="text-4xl">💎</span>
        </div>
        <div>
          <h2 className="text-white font-bold text-xl mb-2">Connect TON Wallet</h2>
          <p className="text-slate-400 text-sm max-w-xs">
            Connect Tonkeeper, MyTonWallet or any TonConnect-compatible wallet to start betting.
          </p>
        </div>
        <button
          onClick={() => tonConnectUI.openModal()}
          className="btn-primary px-8 py-3 text-sm font-semibold"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Balance card */}
      <div className="glass-card p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-400/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400 font-medium">TON Balance</span>
          <button
            onClick={() => fetchBalance && fetchBalance()}
            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-white">
            {isLoadingBalance ? '...' : tonBalance.toFixed(4)}
          </span>
          <span className="text-blue-400 font-semibold">TON</span>
        </div>
        <div className="text-slate-500 text-xs mt-1">
          ≈ ${(tonBalance * 3.2).toFixed(2)} USD
        </div>

        {/* Address */}
        <div className="mt-4 pt-4 border-t border-white/8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 mb-0.5">Wallet Address</div>
              <div className="text-xs text-slate-300 font-mono">
                {address.slice(0, 12)}...{address.slice(-8)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="p-1.5 glass-card-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={`https://tonscan.org/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 glass-card-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit info */}
      <div className="glass-card p-4 space-y-2">
        <h3 className="text-white font-semibold text-sm">💰 Deposit TON</h3>
        <p className="text-slate-400 text-xs">
          Send TON directly to your connected wallet address. Your balance updates automatically every 15 seconds.
        </p>
        <div className="glass-card-sm p-2 font-mono text-xs text-blue-300 break-all select-all">
          {address}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy address'}
        </button>
      </div>

      {/* Withdraw */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-white font-semibold text-sm">📤 Withdraw Winnings</h3>
        <p className="text-slate-400 text-xs">
          Winnings from resolved bets are automatically sent to your wallet. Manual withdrawal available below.
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder={`Max: ${tonBalance.toFixed(2)} TON`}
            min="0.1"
            max={tonBalance}
            step="0.1"
            className="glass-input flex-1 text-sm"
          />
          <button
            onClick={() => setWithdrawAmount(tonBalance.toFixed(2))}
            className="text-xs text-blue-400 hover:text-blue-300 px-2 glass-card-sm"
          >
            Max
          </button>
        </div>
        {withdrawError && (
          <div className="text-red-400 text-xs">⚠️ {withdrawError}</div>
        )}
        <button
          onClick={handleWithdraw}
          disabled={isWithdrawing || !withdrawAmount}
          className="w-full btn-secondary py-2.5 text-sm"
        >
          {isWithdrawing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `Withdraw ${withdrawAmount || '0'} TON`
          )}
        </button>
      </div>

      {/* Transactions */}
      <div className="space-y-2">
        <h3 className="text-white font-semibold text-sm">📋 Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No transactions yet</div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="glass-card p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-white font-medium">{tx.description}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-semibold ${
                    tx.type === 'win' || tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'win' || tx.type === 'deposit' ? '+' : '-'}{tx.amount} TON
                  </div>
                  <div className={`text-[10px] ${
                    tx.status === 'confirmed' ? 'text-green-400' :
                    tx.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {tx.status === 'confirmed' ? '✓ Confirmed' :
                     tx.status === 'failed' ? '✗ Failed' : '⏳ Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disconnect */}
      <button
        onClick={() => tonConnectUI.disconnect()}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-400 hover:text-red-300 border border-red-400/20 rounded-xl hover:bg-red-400/5 transition-all"
      >
        <LogOut className="w-4 h-4" />
        Disconnect Wallet
      </button>
    </div>
  );
}

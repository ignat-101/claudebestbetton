import { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { useBettingStore, type Bet } from '../store/bettingStore';
import { useTonTransactions } from '../hooks/useTonTransactions';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Users, TrendingUp, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  crypto: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  sport: 'text-green-400 bg-green-400/10 border-green-400/20',
  politics: 'text-red-400 bg-red-400/10 border-red-400/20',
  esports: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  custom: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

interface BetCardProps {
  bet: Bet;
}

export function BetCard({ bet }: BetCardProps) {
  const address = useTonAddress();
  const { placeBet: placeBetStore, userBets } = useBettingStore();
  const { placeBet } = useTonTransactions();

  const [expanded, setExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState(bet.minBet.toString());
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const userBet = userBets.find((ub) => ub.betId === bet.id);
  const isDeadlinePassed = new Date() > bet.deadline;
  const totalPool = bet.totalPool;

  const getOdds = (optionId: string) => {
    const opt = bet.options.find((o) => o.id === optionId);
    if (!opt || totalPool === 0) return '—';
    const odds = totalPool / opt.totalStaked;
    return `${odds.toFixed(2)}x`;
  };

  const getPercentage = (optionId: string) => {
    const opt = bet.options.find((o) => o.id === optionId);
    if (!opt || totalPool === 0) return 0;
    return Math.round((opt.totalStaked / totalPool) * 100);
  };

  const handlePlace = async () => {
    if (!address) { setError('Connect your wallet first'); return; }
    if (!selectedOption) { setError('Select an option'); return; }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < bet.minBet) {
      setError(`Minimum bet: ${bet.minBet} TON`);
      return;
    }
    if (amount > bet.maxBet) {
      setError(`Maximum bet: ${bet.maxBet} TON`);
      return;
    }

    setIsPlacing(true);
    setError(null);
    try {
      const boc = await placeBet(bet.id, selectedOption, amount);
      placeBetStore(bet.id, selectedOption, amount, boc || undefined);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setExpanded(false); }, 2500);
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e?.message?.includes('cancelled') || e?.message?.includes('rejected')) {
        setError('Transaction rejected');
      } else {
        setError(e?.message || 'Transaction failed');
      }
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className={`glass-card group hover:border-blue-500/30 transition-all duration-300 ${bet.featured ? 'border-blue-500/25' : ''}`}>
      {bet.featured && (
        <div className="flex items-center gap-1 text-xs text-blue-400 font-semibold mb-2">
          <Zap className="w-3 h-3" />
          FEATURED
        </div>
      )}

      {/* Category + deadline */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[bet.category]}`}>
          {bet.category.toUpperCase()}
        </span>
        <span className={`flex items-center gap-1 text-[11px] ${isDeadlinePassed ? 'text-red-400' : 'text-slate-400'}`}>
          <Clock className="w-3 h-3" />
          {isDeadlinePassed ? 'Closed' : formatDistanceToNow(bet.deadline, { addSuffix: true })}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold text-sm leading-snug mb-3">{bet.title}</h3>

      {/* Pool stats */}
      <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-blue-400" />
          <span className="text-blue-300 font-semibold">{totalPool.toFixed(1)} TON</span>
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {bet.options.reduce((s, o) => s + o.backers, 0)} betters
        </span>
      </div>

      {/* Options bars */}
      <div className="space-y-2 mb-3">
        {bet.options.map((opt) => {
          const pct = getPercentage(opt.id);
          const isSelected = selectedOption === opt.id;
          const isUserOption = userBet?.optionId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => !isDeadlinePassed && !userBet && setSelectedOption(opt.id)}
              disabled={isDeadlinePassed || !!userBet}
              className={`w-full text-left rounded-lg p-2.5 border transition-all duration-200 relative overflow-hidden
                ${isSelected ? 'border-blue-400/60 bg-blue-500/10' : 'border-white/5 bg-white/3 hover:bg-white/5'}
                ${isUserOption ? 'border-green-400/40' : ''}
                ${isDeadlinePassed || userBet ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              {/* Progress bar */}
              <div
                className="absolute inset-0 rounded-lg opacity-10 transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: isSelected ? 'rgba(96,165,250,0.6)' : 'rgba(255,255,255,0.15)',
                }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-xs text-slate-200 font-medium">{opt.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">{pct}%</span>
                  <span className="text-[11px] text-yellow-400 font-semibold">{getOdds(opt.id)}</span>
                  {isUserOption && <span className="text-[10px] text-green-400 font-bold">YOUR BET</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expand / collapse bet panel */}
      {!isDeadlinePassed && !userBet && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors py-1"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Hide</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Place Bet</>
          )}
        </button>
      )}

      {userBet && (
        <div className="text-center text-xs text-green-400 font-medium py-1">
          ✅ You bet {userBet.amount} TON on {bet.options.find(o => o.id === userBet.optionId)?.label}
        </div>
      )}

      {/* Bet panel */}
      {expanded && !userBet && (
        <div className="mt-3 border-t border-white/8 pt-3 space-y-3">
          {success ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-1">🎉</div>
              <div className="text-green-400 font-semibold text-sm">Bet placed successfully!</div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Amount (TON)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min={bet.minBet}
                    max={bet.maxBet}
                    step="0.1"
                    className="glass-input flex-1 text-sm"
                    placeholder={`${bet.minBet} - ${bet.maxBet} TON`}
                  />
                  <div className="flex gap-1">
                    {[bet.minBet, Math.round(bet.maxBet / 2), bet.maxBet].map((v) => (
                      <button
                        key={v}
                        onClick={() => setBetAmount(v.toString())}
                        className="text-[10px] px-1.5 py-1 glass-card-sm text-slate-300 hover:text-blue-400 transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedOption && (
                <div className="glass-card-sm p-2 text-xs text-slate-400">
                  Potential win:{' '}
                  <span className="text-yellow-400 font-semibold">
                    {(parseFloat(betAmount || '0') * parseFloat(getOdds(selectedOption) || '1')).toFixed(2)} TON
                  </span>
                </div>
              )}

              {error && <div className="text-red-400 text-xs">{error}</div>}

              <button
                onClick={handlePlace}
                disabled={isPlacing || !selectedOption}
                className={`w-full btn-primary text-sm py-2.5 ${
                  !selectedOption ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isPlacing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Confirming in wallet...
                  </span>
                ) : (
                  `Bet ${betAmount} TON`
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

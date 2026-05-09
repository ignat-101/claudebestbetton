import { useTonAddress } from '@tonconnect/ui-react';
import { useBettingStore } from '../store/bettingStore';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, TrendingUp, Clock } from 'lucide-react';

export function MyBetsTab() {
  const address = useTonAddress();
  const { userBets, bets } = useBettingStore();

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="text-5xl">🎯</div>
        <h2 className="text-white font-semibold text-lg">No wallet connected</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          Connect your TON wallet to see your active bets and history.
        </p>
      </div>
    );
  }

  if (userBets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="text-5xl">📭</div>
        <h2 className="text-white font-semibold text-lg">No bets yet</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          Go to Discover to place your first bet!
        </p>
      </div>
    );
  }

  const totalStaked = userBets.reduce((s, b) => s + b.amount, 0);
  const wonBets = userBets.filter((b) => b.status === 'won');

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card text-center py-3">
          <div className="text-xl font-bold text-blue-300">{userBets.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total Bets</div>
        </div>
        <div className="glass-card text-center py-3">
          <div className="text-xl font-bold text-yellow-300">{totalStaked.toFixed(2)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">TON Staked</div>
        </div>
        <div className="glass-card text-center py-3">
          <div className="text-xl font-bold text-green-300">{wonBets.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Wins</div>
        </div>
      </div>

      {/* Bets list */}
      <div className="space-y-3">
        {userBets.map((ub, idx) => {
          const bet = bets.find((b) => b.id === ub.betId);
          if (!bet) return null;
          const option = bet.options.find((o) => o.id === ub.optionId);
          const isWon = bet.resolvedOption === ub.optionId && bet.status === 'resolved';
          const isLost = bet.status === 'resolved' && bet.resolvedOption !== ub.optionId;
          const potentialWin = option && bet.totalPool > 0
            ? (ub.amount * (bet.totalPool / option.totalStaked)) * 0.975
            : 0;

          return (
            <div key={idx} className={`glass-card space-y-3 ${isWon ? 'border-green-400/25' : isLost ? 'border-red-400/15' : ''}`}>
              {/* Bet info */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-white text-sm font-medium leading-snug flex-1">{bet.title}</h3>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0
                  ${isWon ? 'bg-green-500/15 text-green-400' :
                    isLost ? 'bg-red-500/15 text-red-400' :
                    'bg-blue-500/15 text-blue-400'}`}
                >
                  {isWon ? '🏆 Won' : isLost ? '❌ Lost' : '⏳ Active'}
                </span>
              </div>

              {/* Option */}
              <div className="glass-card-sm p-2 text-xs">
                <span className="text-slate-400">Your pick: </span>
                <span className="text-white font-medium">{option?.label}</span>
              </div>

              {/* Amounts */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                  <TrendingUp className="w-3 h-3" />
                  Staked: <span className="text-white font-semibold ml-1">{ub.amount} TON</span>
                </div>
                {!isLost && (
                  <div className="text-yellow-400 font-semibold">
                    {isWon ? `Won: ${potentialWin.toFixed(2)} TON` : `Potential: ${potentialWin.toFixed(2)} TON`}
                  </div>
                )}
              </div>

              {/* Deadline + tx */}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(ub.timestamp, { addSuffix: true })}
                </span>
                {ub.txHash && (
                  <a
                    href={`https://tonscan.org/tx/${ub.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                    TonScan
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

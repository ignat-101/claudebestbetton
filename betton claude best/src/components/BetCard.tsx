import { useStore, type Bet } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const CATEGORY_COLORS: Record<string, string> = {
  crypto: 'text-amber-400', weather: 'text-sky-400', sports: 'text-emerald-400',
  politics: 'text-rose-400', custom: 'text-purple-400', news: 'text-blue-400',
};
const CATEGORY_EMOJIS: Record<string, string> = {
  crypto: '₿', weather: '🌤', sports: '⚽', politics: '🏛', custom: '✨', news: '📰',
};

interface Props { bet: Bet; onClick: () => void; }

export function BetCard({ bet, onClick }: Props) {
  const { currentUser } = useStore();
  const myParticipation = bet.participants.find(p => p.userId === currentUser.id);
  const yesWidth = Math.round(bet.yesPrice * 100);
  const timeLeft = formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true });
  const isExpired = bet.resolveAt < Date.now();

  return (
    <div className="glass-card bet-card p-4 animate-fadeIn" onClick={onClick}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {bet.featured && (
            <span className="badge-featured text-[9px] px-1.5 py-0.5 rounded-full font-bold">⭐ ТОП</span>
          )}
          {bet.status === 'active' && (
            <span className="badge-active text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse-glow" />LIVE
            </span>
          )}
          {bet.status === 'voting' && (
            <span className="badge-voting text-[9px] px-1.5 py-0.5 rounded-full font-bold">🗳 VOTE</span>
          )}
          {bet.status === 'resolved' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-white/10 text-white/50">✓ Решено</span>
          )}
          {bet.oracleType === 'price' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">📊 Oracle</span>
          )}
          {bet.oracleType === 'vote' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">⚖️ PoS</span>
          )}
        </div>
        <span className={`text-sm ${CATEGORY_COLORS[bet.category] ?? 'text-white/50'}`}>
          {CATEGORY_EMOJIS[bet.category] ?? '?'}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[13px] font-bold text-white leading-snug mb-3 line-clamp-2">{bet.title}</h3>

      {/* Price bar */}
      <div className="mb-2">
        <div className="flex rounded-md overflow-hidden h-1.5 mb-1.5">
          <div className="yes-bar transition-all duration-500" style={{ width: `${yesWidth}%` }} />
          <div className="no-bar transition-all duration-500" style={{ width: `${100-yesWidth}%` }} />
        </div>
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="text-emerald-400">ДА {yesWidth}%</span>
          <span className="text-red-400">НЕТ {100-yesWidth}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-3 text-[10px] text-white/40">
          <span>💎 {bet.totalVolume > 0 ? bet.totalVolume.toFixed(1) : '0'} TON</span>
          <span>👥 {bet.participants.length}</span>
          {bet.votes.length > 0 && <span>🗳 {bet.votes.length}</span>}
        </div>
        <div className="flex items-center gap-2">
          {myParticipation && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${myParticipation.side === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              Я: {myParticipation.side === 'yes' ? 'ДА' : 'НЕТ'}
            </span>
          )}
          <span className={`text-[10px] ${isExpired ? 'text-red-400/60' : 'text-white/30'}`}>
            {isExpired ? '⏰ Истёк' : `⏱ ${timeLeft}`}
          </span>
        </div>
      </div>
    </div>
  );
}

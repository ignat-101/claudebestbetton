import { Bet } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Users, TrendingUp, Clock, Star } from 'lucide-react';

interface BetCardProps {
  bet: Bet;
  onClick: () => void;
  userHasBet?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  crypto: '₿',
  weather: '🌤',
  sports: '⚽',
  politics: '🗳',
  custom: '🎯',
  news: '📰',
};

const CATEGORY_COLORS: Record<string, string> = {
  crypto: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/20',
  weather: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
  sports: 'from-green-500/20 to-emerald-500/10 border-green-500/20',
  politics: 'from-purple-500/20 to-violet-500/10 border-purple-500/20',
  custom: 'from-pink-500/20 to-rose-500/10 border-pink-500/20',
  news: 'from-gray-500/20 to-slate-500/10 border-gray-500/20',
};

export function BetCard({ bet, onClick, userHasBet }: BetCardProps) {
  const timeLeft = formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true });
  const yesPercent = Math.round(bet.yesPrice * 100);
  const noPercent = Math.round(bet.noPrice * 100);
  const totalParticipants = bet.participants.length;
  
  const volumeFormatted = bet.totalVolume >= 1000
    ? `${(bet.totalVolume / 1000).toFixed(1)}K`
    : bet.totalVolume.toString();

  return (
    <div
      className={`bet-card glass-card p-4 mb-3 border bg-gradient-to-br ${CATEGORY_COLORS[bet.category]}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[bet.category]}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{bet.title}</p>
            <p className="text-xs text-white/40 mt-0.5">by @{bet.creatorUsername}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {bet.featured && (
            <span className="badge-featured text-[10px] px-2 py-0.5 rounded-full font-bold">🔥 ТОП</span>
          )}
          {bet.status === 'pending' && (
            <span className="badge-pending text-[10px] px-2 py-0.5 rounded-full font-bold">⏳ Модерация</span>
          )}
          {bet.status === 'active' && bet.adminApproved && (
            <span className="badge-active text-[10px] px-2 py-0.5 rounded-full font-bold">● Активна</span>
          )}
          {bet.status === 'resolved' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/10 text-white/60">✅ Завершена</span>
          )}
          {userHasBet && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">Ваша ставка</span>
          )}
        </div>
      </div>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold text-sm">ДА {yesPercent}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-red-400 font-bold text-sm">{noPercent}% НЕТ</span>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
          <div className="yes-bar rounded-l-full transition-all duration-500" style={{ width: `${yesPercent}%` }} />
          <div className="no-bar rounded-r-full flex-1 transition-all duration-500" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-1">
          <Star size={11} className="text-yellow-400" />
          <span className="text-yellow-400 font-semibold">{volumeFormatted} ⭐</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={11} />
          <span>{totalParticipants}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={11} className="text-purple-400" />
          <span className="text-purple-400">{bet.votes.length} голосов</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>{timeLeft}</span>
        </div>
      </div>
    </div>
  );
}

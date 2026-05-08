import { type Bet } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const CAT_EMOJI: Record<string, string> = {
  crypto: '₿', weather: '🌤', sports: '⚽', politics: '🏛', custom: '✨', news: '📰',
};

const CAT_COLOR: Record<string, string> = {
  crypto: '#f59e0b', weather: '#38bdf8', sports: '#22c55e',
  politics: '#f43f5e', custom: '#a855f7', news: '#3b82f6',
};

interface Props { bet: Bet; onClick: () => void; }

export function BetCard({ bet, onClick }: Props) {
  const yesPct = Math.round(bet.yesPrice * 100);
  const noPct = 100 - yesPct;
  const isExpired = bet.resolveAt < Date.now();
  const timeLeft = formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true });
  const volume = bet.totalVolume;

  return (
    <div className="market-card p-4" onClick={onClick}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {bet.featured && <span className="badge-featured">🔥 Топ</span>}
          {bet.status === 'active' && (
            <span className="badge-live">
              <span className="live-dot" />
              LIVE
            </span>
          )}
          {bet.status === 'voting' && <span className="badge-voting">🗳 VOTE</span>}
          {bet.status === 'resolved' && <span className="badge-resolved">✓ Resolved</span>}
        </div>
        <span style={{ color: CAT_COLOR[bet.category] || '#64748b', fontSize: 16 }}>
          {CAT_EMOJI[bet.category] || '?'}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, marginBottom: 12 }}
          className="line-clamp-2">
        {bet.title}
      </h3>

      {/* Probability bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 1, marginBottom: 6 }}>
          <div className="prob-bar-yes" style={{ width: `${yesPct}%` }} />
          <div className="prob-bar-no" style={{ width: `${noPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700 }}>
          <span style={{ color: '#22c55e' }}>ДА {yesPct}%</span>
          <span style={{ color: '#ef4444' }}>НЕТ {noPct}%</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: 11, color: '#64748b' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span>💰 {volume > 0 ? volume.toFixed(1) : '0'} TON</span>
          <span>👤 {bet.participants.length}</span>
        </div>
        <span style={{ color: isExpired ? '#ef444499' : '#64748b' }}>
          {isExpired ? '⏰ Истёк' : `⏱ ${timeLeft}`}
        </span>
      </div>
    </div>
  );
}

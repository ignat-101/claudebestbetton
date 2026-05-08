import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Bet } from '../store/useStore';

interface Props {
  bet: Bet;
  onClick: () => void;
}

export function BetCard({ bet, onClick }: Props) {
  const yesPct = Math.round(bet.yesPrice * 100);
  const noPct  = 100 - yesPct;

  return (
    <div className="market-card" onClick={onClick} style={{ padding: 14 }}>
      {/* Badges */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        {bet.featured && <span className="badge-featured">⭐ Топ</span>}
        {bet.status === 'active'   && <span className="badge-live"><span className="live-dot" />LIVE</span>}
        {bet.status === 'voting'   && <span className="badge-voting">🗳 VOTE</span>}
        {bet.status === 'resolved' && <span className="badge-resolved">✓ Resolved</span>}
        {bet.oracleType === 'price' && (
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
            📊 Oracle
          </span>
        )}
        {bet.oracleType === 'vote' && <span className="badge-pos">🗳 PoS</span>}
      </div>

      {/* Title */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, marginBottom: 10 }}>
        {bet.title}
      </div>

      {/* Probability bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 1, marginBottom: 5 }}>
          <div className="prob-bar-yes" style={{ width: `${yesPct}%` }} />
          <div className="prob-bar-no"  style={{ width: `${noPct}%`  }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
          <span style={{ color: '#22c55e' }}>ДА {yesPct}¢</span>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>
            {bet.totalVolume > 0 ? `${bet.totalVolume.toFixed(1)} TON · ${bet.participants.length} уч.` : 'Нет ставок'}
          </span>
          <span style={{ color: '#ef4444' }}>НЕТ {noPct}¢</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#475569' }}>
        <span>@{bet.creatorUsername}</span>
        <span>⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}</span>
      </div>

      {/* Resolved outcome */}
      {bet.status === 'resolved' && bet.resolvedOutcome && (
        <div style={{
          marginTop: 8, padding: '4px 8px', borderRadius: 6,
          background: bet.resolvedOutcome === 'yes' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: bet.resolvedOutcome === 'yes' ? '#22c55e' : '#ef4444',
          fontSize: 12, fontWeight: 700, textAlign: 'center',
        }}>
          {bet.resolvedOutcome === 'yes' ? '✓ ДА победило' : '✗ НЕТ победило'} (PoS консенсус)
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useStore, RANK_META, computeRank, DEMO_USERS } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props { userId?: string | null; }

const AVATARS = ['🎯', '🐋', '🌙', '🦁', '🐯', '⭐', '🦊', '🎲', '💎', '🚀', '🏆', '🎭'];

export function Profile({ userId }: Props) {
  const { currentUser, setCurrentUser, bets, loadDomainsFromWallet,
          setViewingUserId, setActiveTab, tonWalletAddress } = useStore();

  const isOwn = !userId || userId === currentUser.id;
  const demoUser = DEMO_USERS.find(u => u.id === userId);
  const viewUser = isOwn ? currentUser : (demoUser ? { ...demoUser, isAdmin: false, notifications: [] } : null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ username: currentUser.username, bio: currentUser.bio ?? '', avatar: currentUser.avatar });
  const [loadingDomains, setLoadingDomains] = useState(false);

  if (!viewUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
        <p>Пользователь не найден</p>
      </div>
    );
  }

  const rank = computeRank(viewUser.reputation);
  const rankMeta = RANK_META[rank];
  const myBets = bets.filter(b =>
    b.participants.some(p => p.userId === viewUser.id) &&
    (isOwn || viewUser.profilePublic)
  );
  const roi = viewUser.totalWagered > 0
    ? ((viewUser.totalWon - viewUser.totalWagered) / viewUser.totalWagered * 100).toFixed(1)
    : '0.0';
  const roiPos = parseFloat(roi) >= 0;

  const saveEdit = () => {
    setCurrentUser({
      ...currentUser,
      username: draft.username.slice(0, 24) || currentUser.username,
      bio: draft.bio.slice(0, 120),
      avatar: draft.avatar,
    });
    setEditing(false);
  };

  const handleLoadDomains = async () => {
    if (!tonWalletAddress) return;
    setLoadingDomains(true);
    await loadDomainsFromWallet(tonWalletAddress);
    setLoadingDomains(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        {!isOwn && (
          <button onClick={() => { setViewingUserId(null); setActiveTab('bets'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b',
                           fontSize: 13, marginBottom: 10, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
            ← Назад
          </button>
        )}
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
          {isOwn ? 'Профиль' : `@${viewUser.username}`}
        </h1>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '0 16px 16px' }}>
        {/* Avatar & Info */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(59,130,246,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                {viewUser.avatar}
              </div>
              <div style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 12 }}>
                {rankMeta.emoji}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>@{viewUser.username}</span>
                {/* TON domains — shown only in profile */}
                {viewUser.tonDomains.slice(0, 2).map(d => (
                  <span key={d.domain} className="ton-domain">
                    💎 {d.domain} {d.verified && <span style={{ color: '#22c55e' }}>✓</span>}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 12, marginTop: 3 }}>
                <span className={rankMeta.color} style={{ fontWeight: 600 }}>{rankMeta.emoji} {rankMeta.label}</span>
                <span style={{ color: '#475569', marginLeft: 8 }}>Rep: {viewUser.reputation}</span>
              </div>
              {viewUser.bio && (
                <p style={{ margin: '5px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{viewUser.bio}</p>
              )}
              <p style={{ margin: '4px 0 0', fontSize: 10, color: '#374151' }}>
                Участник {formatDistanceToNow(viewUser.joinedAt, { locale: ru, addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Win streak */}
          {viewUser.winStreak > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 10px', background: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
              <span style={{ color: '#fbbf24' }}>🔥 Серия побед: {viewUser.winStreak}</span>
              <span style={{ color: '#475569' }}>Макс: {viewUser.maxWinStreak}</span>
            </div>
          )}

          {isOwn && (
            <button onClick={() => setEditing(!editing)}
                    style={{ fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.05)',
                             border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7,
                             padding: '5px 12px', cursor: 'pointer', width: '100%' }}>
              {editing ? 'Отмена' : '✏️ Редактировать'}
            </button>
          )}
        </div>

        {/* Edit form */}
        {editing && isOwn && (
          <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 10 }}>Редактирование</div>

            {/* Avatar picker */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Аватар</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {AVATARS.map(av => (
                  <button key={av} onClick={() => setDraft({ ...draft, avatar: av })}
                          style={{ width: 36, height: 36, borderRadius: 8, fontSize: 20,
                                   background: draft.avatar === av ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                                   border: `1px solid ${draft.avatar === av ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                   cursor: 'pointer' }}>
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Имя пользователя</div>
              <input className="form-input" value={draft.username}
                     onChange={e => setDraft({ ...draft, username: e.target.value })} maxLength={24} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>О себе</div>
              <textarea className="form-input" rows={2} value={draft.bio}
                        onChange={e => setDraft({ ...draft, bio: e.target.value })} maxLength={120} />
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '9px' }} onClick={saveEdit}>
              Сохранить
            </button>
          </div>
        )}

        {/* TON Domains (ONLY in Profile, only if they exist) */}
        {isOwn && (
          <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="section-label">TON DNS</div>
              {tonWalletAddress && (
                <button onClick={handleLoadDomains} disabled={loadingDomains}
                        style={{ fontSize: 11, color: '#60a5fa', background: 'rgba(59,130,246,0.1)',
                                 border: '1px solid rgba(59,130,246,0.2)', borderRadius: 6,
                                 padding: '4px 10px', cursor: 'pointer' }}>
                  {loadingDomains ? '⏳ Загрузка...' : '🔄 Обновить'}
                </button>
              )}
            </div>

            {viewUser.tonDomains.length === 0 ? (
              tonWalletAddress ? (
                <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                  На вашем кошельке нет .ton доменов. Домены из TON DNS NFT появятся автоматически после нажатия «Обновить».
                </p>
              ) : (
                <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
                  Подключите кошелёк — TON домены с него появятся здесь.
                </p>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {viewUser.tonDomains.map(d => (
                  <div key={d.domain} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                               padding: '8px 10px', background: 'rgba(0,136,255,0.07)',
                                               border: '1px solid rgba(0,136,255,0.15)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 16 }}>💎</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>{d.domain}</div>
                        <div style={{ fontSize: 10, color: '#475569' }}>
                          {d.verified ? '✓ Верифицирован' : 'Не верифицирован'} · NFT в кошельке
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Статистика</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Вложено', value: `${viewUser.totalWagered.toFixed(1)} TON` },
              { label: 'Выиграно', value: `${viewUser.totalWon.toFixed(1)} TON`, color: '#22c55e' },
              { label: 'ROI', value: `${roiPos ? '+' : ''}${roi}%`, color: roiPos ? '#22c55e' : '#ef4444' },
              { label: 'Ставок', value: myBets.length.toString() },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: color || '#f1f5f9' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet */}
        {isOwn && (
          <div className="glass-card" style={{ padding: 14, marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Кошелёк</div>
            {tonWalletAddress ? (
              <div style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓ Подключён</span>
                <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: 11 }}>
                  {tonWalletAddress.slice(0, 10)}...{tonWalletAddress.slice(-6)}
                </span>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Кошелёк не подключён. Используйте кнопку «Подключить» вверху страницы.
              </p>
            )}
          </div>
        )}

        {/* Recent bets */}
        {myBets.length > 0 && (
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>
              {isOwn ? 'Мои ставки' : 'Ставки пользователя'}
            </div>
            {myBets.slice(0, 5).map(bet => {
              const myP = bet.participants.find(p => p.userId === viewUser.id);
              return (
                <div key={bet.id} className="glass-card" style={{ padding: '10px 14px', marginBottom: 8,
                                                                    display: 'flex', justifyContent: 'space-between',
                                                                    alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.3 }} className="line-clamp-1">
                      {bet.title}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                      {myP?.side === 'yes' ? 'ДА' : 'НЕТ'} · {myP?.amount.toFixed(2)} TON
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, flexShrink: 0,
                                color: bet.status === 'active' ? '#22c55e' : '#64748b' }}>
                    {bet.status === 'active' ? '● LIVE' : bet.status === 'resolved' ? '✓' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

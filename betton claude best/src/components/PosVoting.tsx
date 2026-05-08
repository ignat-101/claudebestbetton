import { useState } from 'react';
import { useStore } from '../store/useStore';
import { computePosResult, SECURITY_CONFIG } from '../security/proofOfStake';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export function PosVoting() {
  const { bets, currentUser, tonWalletAddress, addPosVote } = useStore();
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null);
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);
  const [stake, setStake] = useState(0.5);
  const [confidence, setConfidence] = useState(80);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txError, setTxError] = useState('');

  const isConnected = !!tonWalletAddress;

  // Only show active/voting bets that use PoS (or all non-resolved for voting)
  const votableBets = bets.filter(b => b.status !== 'resolved' && b.status !== 'cancelled');
  const resolvedBets = bets.filter(b => b.status === 'resolved');

  const selectedBet = bets.find(b => b.id === selectedBetId);
  void selectedBet; // used inline

  const myVotingPower = currentUser
    ? Math.sqrt(Math.max(0, currentUser.stakedAmount)) * Math.sqrt(currentUser.reputation) * (1 + stake)
    : 0;

  const handleVote = async () => {
    if (!choice || !selectedBetId || !isConnected) return;
    setTxStatus('pending'); setTxError('');
    await new Promise(r => setTimeout(r, 800));
    const result = addPosVote(selectedBetId, choice, stake, confidence);
    if (!result.ok) { setTxError(result.error || 'Ошибка'); setTxStatus('error'); return; }
    setTxStatus('success');
    setChoice(null);
    setTimeout(() => setTxStatus('idle'), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>🗳</span>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Proof-of-Stake Голосование</h1>
        </div>
        <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
          Стейкайте TON чтобы голосовать за результаты событий. Ваш вес = √стейк × √репутация.
        </p>

        {/* Stats */}
        {currentUser && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
            {[
              { label: 'Репутация', value: currentUser.reputation, emoji: '⚡' },
              { label: 'Стейк (TON)', value: currentUser.stakedAmount.toFixed(2), emoji: '💎' },
              { label: 'Сила голоса', value: myVotingPower.toFixed(1), emoji: '🏛' },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ padding: '8px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 14 }}>{s.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '12px 16px 16px' }}>
        {/* How it works */}
        <div className="pos-card" style={{ padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#c084fc', marginBottom: 6 }}>🔐 Как работает PoS голосование</div>
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
            <div>• Вес голоса = <code style={{ color: '#a5b4fc' }}>√стейк × √репутация × (1 + бонус_за_возраст)</code></div>
            <div>• Квалифицированное большинство: {Math.round(SECURITY_CONFIG.QUORUM_THRESHOLD * 100)}% для кворума</div>
            <div>• Суперквалифицированное: {Math.round(SECURITY_CONFIG.SUPERMAJORITY_THRESHOLD * 100)}% — автоматическое разрешение</div>
            <div>• Минимум {SECURITY_CONFIG.MIN_VALIDATORS_FOR_RESOLUTION} валидаторов для разрешения</div>
            <div>• Мин. стейк: {SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON} TON</div>
            <div>• Защита от коллюзии через анализ времени голосования</div>
          </div>
        </div>

        {!isConnected && (
          <div style={{ textAlign: 'center', padding: '30px 16px', color: '#475569' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💎</div>
            <p style={{ marginBottom: 8 }}>Подключите TON кошелёк для участия в голосовании</p>
          </div>
        )}

        {/* Votable bets */}
        <div className="section-label" style={{ marginBottom: 8 }}>Открытые голосования ({votableBets.length})</div>
        {votableBets.length === 0 && (
          <div style={{ color: '#475569', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            Нет активных голосований. Создайте событие!
          </div>
        )}
        {votableBets.map(bet => {
          const isSelected = selectedBetId === bet.id;
          const voted = bet.posVotes.some(v => v.userId === currentUser?.id);
          const pr = bet.posVotes.length > 0
            ? computePosResult(bet.posVotes.map(v => ({
                userId: v.userId, username: v.username, choice: v.choice,
                stake: v.stake, reputation: v.reputation, timestamp: v.timestamp,
                stakeAge: v.stakeAge, confidence: v.confidence,
              })))
            : null;

          return (
            <div key={bet.id} className="market-card" style={{ marginBottom: 10, padding: 14 }}>
              <div onClick={() => setSelectedBetId(isSelected ? null : bet.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', flex: 1, lineHeight: 1.4 }}>{bet.title}</div>
                  <div style={{ marginLeft: 8, flexShrink: 0 }}>
                    {voted && <span style={{ fontSize: 10, color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: 4 }}>✓ Проголосовал</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                  <span>👥 {bet.posVotes.length} валидаторов</span>
                  <span>⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}</span>
                  {bet.oracleType === 'vote' && <span className="badge-pos">PoS</span>}
                </div>

                {/* PoS progress */}
                {pr && (
                  <div>
                    <div style={{ display: 'flex', height: 5, borderRadius: 3, overflow: 'hidden', gap: 1, marginBottom: 4 }}>
                      <div style={{ width: `${pr.yesWeightPct}%`, background: 'rgba(34,197,94,0.7)', borderRadius: '3px 0 0 3px', transition: 'width 0.5s' }} />
                      <div style={{ width: `${pr.noWeightPct}%`, background: 'rgba(239,68,68,0.6)', borderRadius: '0 3px 3px 0', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
                      <span style={{ color: '#22c55e' }}>ДА {pr.yesWeightPct}%</span>
                      <span>{pr.quorumReached ? '✅ Кворум' : `${pr.validatorCount}/${SECURITY_CONFIG.MIN_VALIDATORS_FOR_RESOLUTION} вал.`}</span>
                      <span style={{ color: '#ef4444' }}>НЕТ {pr.noWeightPct}%</span>
                    </div>
                    {pr.collisionRisk && (
                      <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4 }}>⚠️ Подозрение на коллюзию — голоса поданы одновременно</div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                  {isSelected ? '▲ Скрыть форму' : '▼ Проголосовать'}
                </div>
              </div>

              {/* Vote form */}
              {isSelected && !voted && isConnected && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Choice */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <button
                      className={`btn-yes ${choice === 'yes' ? 'active' : ''}`}
                      onClick={() => setChoice(choice === 'yes' ? null : 'yes')}
                      style={{ padding: '10px', fontSize: 13 }}
                    >
                      ✓ ДА
                    </button>
                    <button
                      className={`btn-no ${choice === 'no' ? 'active' : ''}`}
                      onClick={() => setChoice(choice === 'no' ? null : 'no')}
                      style={{ padding: '10px', fontSize: 13 }}
                    >
                      ✗ НЕТ
                    </button>
                  </div>

                  {/* Stake amount */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      <span>Стейк для голосования (TON)</span>
                      <span style={{ color: '#a855f7' }}>Вес: {(Math.sqrt(stake) * Math.sqrt(currentUser?.reputation ?? 100)).toFixed(2)}</span>
                    </div>
                    <input type="range" className="stake-slider"
                      min={SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON} max={5} step={0.1}
                      value={stake} onChange={e => setStake(parseFloat(e.target.value))} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                      <span>{SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON} TON</span>
                      <span style={{ fontWeight: 700, color: '#c084fc' }}>{stake.toFixed(1)} TON</span>
                      <span>5 TON</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      <span>Уверенность в голосе</span>
                      <span style={{ color: '#c084fc' }}>{confidence}%</span>
                    </div>
                    <input type="range" className="stake-slider" min={10} max={100} step={5}
                      value={confidence} onChange={e => setConfidence(parseInt(e.target.value))} />
                  </div>

                  {txStatus === 'error' && (
                    <div style={{ padding: '8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12, marginBottom: 8 }}>
                      ❌ {txError}
                    </div>
                  )}
                  {txStatus === 'success' && (
                    <div style={{ padding: '8px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 12, marginBottom: 8 }}>
                      ✅ Голос принят!
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    onClick={handleVote}
                    disabled={!choice || txStatus === 'pending'}
                    style={{ width: '100%', padding: 10, fontSize: 13 }}
                  >
                    {txStatus === 'pending' ? '⏳...' : `Проголосовать ${stake.toFixed(1)} TON за ${choice === 'yes' ? 'ДА' : choice === 'no' ? 'НЕТ' : '...'}`}
                  </button>
                </div>
              )}

              {isSelected && voted && (
                <div style={{ marginTop: 10, padding: '8px', borderRadius: 8, background: 'rgba(168,85,247,0.08)', color: '#c084fc', fontSize: 12, textAlign: 'center' }}>
                  ✓ Вы уже проголосовали за это событие
                </div>
              )}

              {isSelected && !isConnected && (
                <div style={{ marginTop: 10, padding: '8px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontSize: 12, textAlign: 'center' }}>
                  Подключите кошелёк для голосования
                </div>
              )}
            </div>
          );
        })}

        {/* Resolved bets with PoS results */}
        {resolvedBets.length > 0 && (
          <>
            <div className="section-label" style={{ marginBottom: 8, marginTop: 16 }}>Завершённые ({resolvedBets.length})</div>
            {resolvedBets.map(bet => {
              const pr = bet.posVotes.length > 0
                ? computePosResult(bet.posVotes.map(v => ({
                    userId: v.userId, username: v.username, choice: v.choice,
                    stake: v.stake, reputation: v.reputation, timestamp: v.timestamp,
                    stakeAge: v.stakeAge, confidence: v.confidence,
                  })))
                : null;

              return (
                <div key={bet.id} className="glass-card" style={{ marginBottom: 10, padding: 14, opacity: 0.8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{bet.title}</div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, alignItems: 'center' }}>
                    {bet.resolvedOutcome && (
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                        background: bet.resolvedOutcome === 'yes' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: bet.resolvedOutcome === 'yes' ? '#22c55e' : '#ef4444',
                      }}>
                        {bet.resolvedOutcome === 'yes' ? '✓ ДА' : '✗ НЕТ'}
                      </span>
                    )}
                    {pr && <span style={{ color: '#64748b' }}>👥 {pr.validatorCount} вал. · {pr.confidence}% уверенность</span>}
                    <span style={{ color: '#64748b' }}>Стейк: {bet.posVotes.reduce((s, v) => s + v.stake, 0).toFixed(2)} TON</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { computePosResult, SECURITY_CONFIG } from '../security/proofOfStake';

export function AdminPanel() {
  const { bets, currentUser, approveBet, rejectBet, resolveBet } = useStore();
  const [activeSection, setActiveSection] = useState<'pending' | 'active' | 'resolve'>('pending');
  const [resolveChoice, setResolveChoice] = useState<Record<string, 'yes' | 'no'>>({});
  const [resolveMethod, setResolveMethod] = useState<Record<string, 'oracle' | 'pos' | 'admin'>>({});
  const [resolveErrors, setResolveErrors] = useState<Record<string, string>>({});

  if (!currentUser.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/30 px-6 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <div className="text-sm font-bold text-white/40 mb-2">Доступ запрещён</div>
        <div className="text-xs text-white/20">
          Панель администратора доступна только авторизованным через Telegram.
          isAdmin определяется из Telegram initData (HMAC-SHA256), а не из localStorage.
        </div>
        <div className="glass-card p-3 mt-4 border border-red-500/20 w-full">
          <div className="text-[10px] font-bold text-red-400 mb-1">🔐 Защита</div>
          <div className="text-[10px] text-white/30">
            isAdmin: {String(currentUser.isAdmin)} (из Telegram initData)
          </div>
        </div>
      </div>
    );
  }

  const pendingBets = bets.filter((b) => b.status === 'pending');
  const activeBets = bets.filter((b) => b.status === 'active' && b.adminApproved);
  const totalVolumeTON = bets.reduce((s, b) => s + b.totalVolume, 0);
  const totalFees = totalVolumeTON * SECURITY_CONFIG.PLATFORM_FEE_PCT;

  const handleResolve = (betId: string) => {
    const choice = resolveChoice[betId];
    const method = resolveMethod[betId] ?? 'pos';
    if (!choice) {
      setResolveErrors((prev) => ({ ...prev, [betId]: 'Выберите исход' }));
      return;
    }

    const result = resolveBet(betId, choice, method);
    if (!result.ok) {
      setResolveErrors((prev) => ({ ...prev, [betId]: result.error ?? 'Ошибка' }));
    } else {
      setResolveErrors((prev) => ({ ...prev, [betId]: '' }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white mb-0.5">🛡️ Панель администратора</h1>
        <div className="text-xs text-white/40 mb-3">Управление ставками · PoS защита активна</div>

        {/* Security banner */}
        <div className="glass-card p-2.5 mb-3 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">🔐</span>
            <div className="text-[10px] text-emerald-400 font-bold">
              PoS Protection ON · Квадратичное взвешивание · Кворум {Math.round(SECURITY_CONFIG.QUORUM_THRESHOLD * 100)}%
            </div>
          </div>
        </div>

        {/* Treasury summary */}
        <div className="glass-card p-3 mb-3 border border-purple-500/20">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-[#0098EA]">{totalVolumeTON.toFixed(3)}</div>
              <div className="text-[10px] text-white/40">TON объём</div>
            </div>
            <div>
              <div className="text-sm font-bold text-yellow-400">{totalFees.toFixed(4)}</div>
              <div className="text-[10px] text-white/40">Комиссии</div>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-400">{activeBets.length}</div>
              <div className="text-[10px] text-white/40">Активных</div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex gap-1 glass-card p-1 rounded-xl">
          {[
            { key: 'pending', label: `Ожидают (${pendingBets.length})` },
            { key: 'active', label: `Активные (${activeBets.length})` },
            { key: 'resolve', label: 'Завершить' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key as typeof activeSection)}
              className={`flex-1 text-[10px] py-1.5 rounded-lg font-semibold transition-all ${
                activeSection === s.key ? 'bg-purple-500/30 text-purple-300' : 'text-white/40'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-3">
        {/* Pending bets */}
        {activeSection === 'pending' && (
          <>
            {pendingBets.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-xs text-white/40">Нет ставок на модерации</div>
              </div>
            ) : (
              pendingBets.map((bet) => (
                <div key={bet.id} className="glass-card p-3 border border-yellow-500/20 animate-fadeIn">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="badge-pending text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">⏳ ОЖИДАНИЕ</span>
                    <h3 className="text-xs font-bold text-white leading-tight">{bet.title}</h3>
                  </div>
                  <p className="text-[10px] text-white/40 mb-2 line-clamp-2">{bet.description}</p>
                  <div className="flex gap-2 text-[10px] text-white/40 mb-1">
                    <span>{bet.category}</span>
                    <span>·</span>
                    <span>@{bet.creatorUsername}</span>
                    <span>·</span>
                    <span>Оракул: {bet.oracleType}</span>
                  </div>
                  {bet.oracleSymbol && (
                    <div className="text-[10px] text-blue-400/60 mb-2">
                      📊 {bet.oracleSymbol} {bet.oracleDirection === 'above' ? '>' : '<'} ${bet.oracleTarget?.toLocaleString()}
                    </div>
                  )}
                  <div className="text-[10px] text-white/20 mb-3">
                    ✅ Пул при старте: 0 TON (реальные ставки)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveBet(bet.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold"
                    >
                      ✅ Одобрить
                    </button>
                    <button
                      onClick={() => rejectBet(bet.id)}
                      className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Active bets */}
        {activeSection === 'active' && (
          <>
            {activeBets.map((bet) => {
              const posResult = computePosResult(bet.votes);
              return (
                <div key={bet.id} className="glass-card p-3 animate-fadeIn">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="badge-active text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">● LIVE</span>
                    <h3 className="text-xs font-bold text-white leading-tight">{bet.title}</h3>
                  </div>
                  <div className="flex gap-3 text-[10px] text-white/40 mb-2">
                    <span>💎 {bet.totalVolume.toFixed(3)} TON</span>
                    <span>· {bet.participants.length} уч.</span>
                    <span>· ДА {Math.round(bet.yesPrice * 100)}%</span>
                  </div>
                  {bet.oracleType === 'vote' && (
                    <div className="text-[10px] text-purple-400/70">
                      🗳 PoS: {posResult.validatorCount} валидаторов · {posResult.quorumReached ? '✓ Кворум' : `Нет кворума (нужно ${SECURITY_CONFIG.MIN_VALIDATORS_FOR_RESOLUTION}+)`}
                    </div>
                  )}
                  <div className="text-[10px] text-white/30 mt-1">
                    ⏱ {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}
                  </div>
                </div>
              );
            })}
            {activeBets.length === 0 && (
              <div className="glass-card p-6 text-center text-white/30 text-xs">Нет активных ставок</div>
            )}
          </>
        )}

        {/* Resolve bets */}
        {activeSection === 'resolve' && (
          <>
            {activeBets.map((bet) => {
              const posResult = computePosResult(bet.votes);
              return (
                <div key={bet.id} className="glass-card p-3 border border-blue-500/20 animate-fadeIn">
                  <h3 className="text-xs font-bold text-white mb-2 leading-tight">{bet.title}</h3>
                  <div className="flex gap-2 text-[10px] text-white/40 mb-2">
                    <span>💎 {bet.totalVolume.toFixed(3)} TON</span>
                    <span>· {bet.participants.length} уч.</span>
                  </div>

                  {/* Oracle info */}
                  <div className="text-[10px] text-white/40 mb-2">
                    {bet.oracleType === 'price' && `📊 Авто: ${bet.oracleSymbol} ${bet.oracleDirection === 'above' ? '>' : '<'} $${bet.oracleTarget?.toLocaleString()}`}
                    {bet.oracleType === 'vote' && (
                      <span className={posResult.quorumReached ? 'text-emerald-400' : 'text-yellow-400'}>
                        🗳 PoS: {posResult.validatorCount} вал. · ДА {posResult.yesWeightPct}% / НЕТ {posResult.noWeightPct}%
                        {posResult.quorumReached ? ` · ✓ Кворум → ${posResult.outcome?.toUpperCase()}` : ` · ⚠️ Нет кворума`}
                      </span>
                    )}
                    {bet.oracleType === 'manual' && '👤 Ручное + PoS проверка'}
                  </div>

                  {/* Method selection */}
                  <div className="flex gap-1 mb-2">
                    {(['oracle', 'pos', 'admin'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setResolveMethod((prev) => ({ ...prev, [bet.id]: m }))}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                          (resolveMethod[bet.id] ?? 'pos') === m
                            ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30'
                            : 'glass-card text-white/30'
                        }`}
                      >
                        {m === 'oracle' ? '📊 Авто' : m === 'pos' ? '🗳 PoS' : '👤 Адм.'}
                      </button>
                    ))}
                  </div>

                  {/* Choice */}
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setResolveChoice((prev) => ({ ...prev, [bet.id]: 'yes' }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        resolveChoice[bet.id] === 'yes' ? 'bg-emerald-500/40 text-emerald-300 border border-emerald-400' : 'btn-yes'
                      }`}
                    >
                      ✅ ДА победило
                    </button>
                    <button
                      onClick={() => setResolveChoice((prev) => ({ ...prev, [bet.id]: 'no' }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        resolveChoice[bet.id] === 'no' ? 'bg-red-500/40 text-red-300 border border-red-400' : 'btn-no'
                      }`}
                    >
                      ❌ НЕТ победило
                    </button>
                  </div>

                  {/* PoS warning */}
                  {(resolveMethod[bet.id] ?? 'pos') === 'pos' && bet.oracleType === 'vote' && !posResult.quorumReached && (
                    <div className="glass-card p-2 border border-yellow-500/20 mb-2 rounded-xl">
                      <div className="text-[9px] text-yellow-400">
                        ⚠️ Кворум не достигнут. Разрешение заблокировано до накопления {Math.round(SECURITY_CONFIG.QUORUM_THRESHOLD * 100)}% веса.
                      </div>
                    </div>
                  )}

                  {resolveErrors[bet.id] && (
                    <div className="glass-card p-2 border border-red-500/20 mb-2 rounded-xl">
                      <div className="text-[10px] text-red-400">❌ {resolveErrors[bet.id]}</div>
                    </div>
                  )}

                  <button
                    onClick={() => handleResolve(bet.id)}
                    disabled={!resolveChoice[bet.id]}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      resolveChoice[bet.id]
                        ? 'btn-primary text-white'
                        : 'glass-card text-white/30 cursor-not-allowed'
                    }`}
                  >
                    🏁 Завершить ставку
                  </button>
                </div>
              );
            })}
            {activeBets.length === 0 && (
              <div className="glass-card p-6 text-center text-white/30 text-xs">Нет ставок для завершения</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

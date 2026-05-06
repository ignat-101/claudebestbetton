import { useState } from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle, XCircle, Shield, TrendingUp, Star, Zap, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const ADMIN_WALLET = 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';

export function AdminPanel() {
  const { bets, treasury, approveBet, rejectBet, resolveBet, setSelectedBetId, setActiveTab, currentUser } = useStore();
  const [activeSection, setActiveSection] = useState<'pending' | 'active' | 'treasury' | 'users'>('pending');
  const [resolveModal, setResolveModal] = useState<string | null>(null);

  if (!currentUser.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="glass-card p-8 text-center border border-red-500/20">
          <Shield size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Доступ запрещён</h2>
          <p className="text-sm text-white/50">Только администраторы имеют доступ к этой панели</p>
        </div>
      </div>
    );
  }

  const pendingBets = bets.filter((b) => b.status === 'pending');
  const activeBets = bets.filter((b) => b.status === 'active' && b.adminApproved);
  const resolvedBets = bets.filter((b) => b.status === 'resolved');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} className="text-purple-400" />
          <h1 className="text-xl font-black text-white">Панель администратора</h1>
        </div>
        <p className="text-xs text-white/40">Управление платформой TON FlashBet</p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="glass-card p-2 text-center">
            <div className="text-base font-black text-red-400">{pendingBets.length}</div>
            <div className="text-[9px] text-white/30">Ожидают</div>
          </div>
          <div className="glass-card p-2 text-center">
            <div className="text-base font-black text-emerald-400">{activeBets.length}</div>
            <div className="text-[9px] text-white/30">Активных</div>
          </div>
          <div className="glass-card p-2 text-center">
            <div className="text-base font-black text-blue-400">{resolvedBets.length}</div>
            <div className="text-[9px] text-white/30">Завершено</div>
          </div>
          <div className="glass-card p-2 text-center">
            <div className="text-base font-black text-yellow-400">{(treasury.totalBalance / 1000).toFixed(0)}K</div>
            <div className="text-[9px] text-white/30">⭐ Казна</div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 mt-3 glass-card p-1">
          {([
            { key: 'pending', label: '⏳ Модерация', count: pendingBets.length },
            { key: 'active', label: '✅ Активные', count: activeBets.length },
            { key: 'treasury', label: '💰 Казна', count: 0 },
          ] as const).map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-xl transition-all ${
                activeSection === s.key
                  ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40'
                  : 'text-white/40'
              }`}
            >
              {s.label}
              {s.count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  s.key === 'pending' ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/50'
                }`}>
                  {s.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4">
        {/* Pending section */}
        {activeSection === 'pending' && (
          <div>
            {pendingBets.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Нет ставок на модерации</p>
              </div>
            ) : (
              pendingBets.map((bet) => (
                <div key={bet.id} className="glass-card p-4 mb-3 border border-yellow-500/20 animate-fadeIn">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white leading-snug">{bet.title}</p>
                      <p className="text-xs text-white/40 mt-1">@{bet.creatorUsername} · {formatDistanceToNow(bet.createdAt, { locale: ru, addSuffix: true })}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedBetId(bet.id); setActiveTab('bets'); }}
                      className="glass p-2 rounded-xl flex-shrink-0"
                    >
                      <Eye size={14} className="text-white/50" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-white/50 mb-3 line-clamp-3">{bet.description}</p>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="glass rounded-xl p-2.5">
                      <div className="text-[10px] text-white/40">Категория</div>
                      <div className="text-xs text-white font-semibold mt-0.5">{bet.category}</div>
                    </div>
                    <div className="glass rounded-xl p-2.5">
                      <div className="text-[10px] text-white/40">Оракул</div>
                      <div className="text-xs text-white font-semibold mt-0.5">{bet.oracleType}</div>
                    </div>
                    <div className="glass rounded-xl p-2.5">
                      <div className="text-[10px] text-white/40">Ликвидность</div>
                      <div className="text-xs text-yellow-400 font-bold mt-0.5">{(bet.yesPool + bet.noPool)} ⭐</div>
                    </div>
                    <div className="glass rounded-xl p-2.5">
                      <div className="text-[10px] text-white/40">Срок</div>
                      <div className="text-xs text-white font-semibold mt-0.5">
                        {formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true })}
                      </div>
                    </div>
                  </div>

                  {bet.oracleType === 'price' && bet.oracleSymbol && (
                    <div className="glass-card p-2.5 mb-3 border border-blue-500/20 text-xs">
                      <span className="text-blue-400 font-bold">Оракул: </span>
                      <span className="text-white/60">{bet.oracleSymbol} {bet.oracleDirection === 'above' ? '>' : '<'} ${bet.oracleTarget?.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => approveBet(bet.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm hover:bg-emerald-500/30 transition-all"
                    >
                      <CheckCircle size={16} />
                      Одобрить
                    </button>
                    <button
                      onClick={() => rejectBet(bet.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-sm hover:bg-red-500/30 transition-all"
                    >
                      <XCircle size={16} />
                      Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Active section */}
        {activeSection === 'active' && (
          <div>
            {activeBets.map((bet) => (
              <div key={bet.id} className="glass-card p-4 mb-3">
                <p className="text-sm font-bold text-white mb-2 line-clamp-1">{bet.title}</p>

                <div className="flex justify-between text-xs text-white/50 mb-3">
                  <span>Объем: <span className="text-yellow-400">{bet.totalVolume} ⭐</span></span>
                  <span>Участников: <span className="text-purple-300">{bet.participants.length}</span></span>
                  <span>Голосов: <span className="text-blue-300">{bet.votes.length}</span></span>
                </div>

                <div className="h-1.5 rounded-full overflow-hidden flex mb-3">
                  <div className="yes-bar rounded-l-full" style={{ width: `${Math.round(bet.yesPrice * 100)}%` }} />
                  <div className="no-bar rounded-r-full flex-1" />
                </div>

                {/* Resolve */}
                {resolveModal === bet.id ? (
                  <div className="glass-card p-3 border border-purple-500/20 animate-fadeIn">
                    <p className="text-xs font-bold text-white mb-3">Выберите результат:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { resolveBet(bet.id, 'yes'); setResolveModal(null); }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                      >
                        ✅ ДА победило
                      </button>
                      <button
                        onClick={() => { resolveBet(bet.id, 'no'); setResolveModal(null); }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-300"
                      >
                        ❌ НЕТ победило
                      </button>
                      <button
                        onClick={() => setResolveModal(null)}
                        className="px-3 py-2 rounded-xl text-xs text-white/40 border border-white/10"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolveModal(bet.id)}
                    className="w-full py-2 rounded-xl text-xs font-bold glass border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-all"
                  >
                    <Zap size={12} className="inline mr-1" />
                    Завершить ставку
                  </button>
                )}
              </div>
            ))}
            {activeBets.length === 0 && (
              <div className="text-center py-16">
                <TrendingUp size={40} className="text-blue-400 mx-auto mb-3" />
                <p className="text-white/40 text-sm">Нет активных ставок</p>
              </div>
            )}
          </div>
        )}

        {/* Treasury section */}
        {activeSection === 'treasury' && (
          <div>
            {/* Treasury card */}
            <div className="glass-card p-5 mb-4 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-yellow-400" />
                <span className="text-sm font-bold text-yellow-300">Казна платформы</span>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-4">
                <div className="glass rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs text-white/50">Общий баланс</span>
                  <span className="text-yellow-400 font-black text-lg">{treasury.totalBalance.toLocaleString()} ⭐</span>
                </div>
                <div className="glass rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs text-white/50">Собрано комиссий</span>
                  <span className="text-purple-400 font-bold">{treasury.totalFees.toLocaleString()} ⭐</span>
                </div>
                <div className="glass rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs text-white/50">Выплачено</span>
                  <span className="text-emerald-400 font-bold">{treasury.totalPaidOut.toLocaleString()} ⭐</span>
                </div>
              </div>

              {/* Wallet address */}
              <div className="glass rounded-xl p-3 border border-blue-500/20">
                <p className="text-[10px] text-blue-400 font-bold mb-1">TON Кошелёк платформы</p>
                <p className="text-[11px] text-white/60 break-all font-mono">{ADMIN_WALLET}</p>
              </div>
            </div>

            {/* Fee structure */}
            <div className="glass-card p-4 mb-4 border border-purple-500/20">
              <p className="text-xs font-bold text-purple-300 mb-3">Структура комиссий</p>
              <div className="space-y-2">
                {[
                  { label: 'Комиссия с каждой ставки', value: '5%', color: 'text-yellow-400' },
                  { label: 'Reward для валидаторов', value: '2%', color: 'text-purple-400' },
                  { label: 'Реферальный бонус', value: '1%', color: 'text-blue-400' },
                  { label: 'Доход платформы', value: '2%', color: 'text-emerald-400' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-white/50">{item.label}</span>
                    <span className={`text-xs font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent transactions */}
            <div className="glass-card p-4">
              <p className="text-xs font-bold text-white/60 mb-3">Последние транзакции</p>
              {treasury.transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-white/5">
                  <div>
                    <p className="text-xs text-white/70">{tx.description}</p>
                    <p className="text-[10px] text-white/30">
                      {formatDistanceToNow(tx.timestamp, { locale: ru, addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${tx.type === 'win' || tx.type === 'refund' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {tx.type === 'win' || tx.type === 'refund' ? '-' : '+'}{tx.amount} ⭐
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

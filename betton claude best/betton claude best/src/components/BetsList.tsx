import { useState } from 'react';
import { useStore, BetCategory } from '../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const CATEGORIES: { key: BetCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Все', icon: '🎲' },
  { key: 'crypto', label: 'Крипто', icon: '₿' },
  { key: 'sports', label: 'Спорт', icon: '⚽' },
  { key: 'politics', label: 'Политика', icon: '🗳' },
  { key: 'weather', label: 'Погода', icon: '🌤' },
  { key: 'news', label: 'Новости', icon: '📰' },
  { key: 'custom', label: 'Личный', icon: '🎯' },
];

export function BetsList() {
  const { bets, filterCategory, setFilterCategory, searchQuery, setSearchQuery, setSelectedBetId } = useStore();
  const [sortBy, setSortBy] = useState<'volume' | 'newest' | 'ending'>('volume');

  const activeBets = bets.filter((b) => b.adminApproved && b.status === 'active');

  const filtered = activeBets
    .filter((b) => filterCategory === 'all' || b.category === filterCategory)
    .filter((b) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.tags.some((t) => t.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'ending') return a.resolveAt - b.resolveAt;
      return 0;
    });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-black text-white">⚡ FlashBet</h1>
            <p className="text-[11px] text-white/40">{filtered.length} активных ставок • TON</p>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="glass-input text-[11px] rounded-lg px-2 py-1.5"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <option value="volume" style={{ background: '#050510' }}>По объёму</option>
            <option value="newest" style={{ background: '#050510' }}>Новые</option>
            <option value="ending" style={{ background: '#050510' }}>Скоро итог</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <input
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm pl-9"
            placeholder="Поиск ставок..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`chip flex-shrink-0 ${filterCategory === cat.key ? 'active' : ''}`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bets list */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/30">
            <div className="text-4xl mb-2">🎲</div>
            <p className="text-sm">Нет активных ставок</p>
          </div>
        ) : (
          filtered.map((bet) => {
            const yesPct = Math.round(bet.yesPrice * 100);
            const noPct = 100 - yesPct;
            const timeLeft = formatDistanceToNow(bet.resolveAt, { locale: ru, addSuffix: true });
            const volume = bet.totalVolume;

            return (
              <div
                key={bet.id}
                className="glass-card p-4 bet-card"
                onClick={() => setSelectedBetId(bet.id)}
              >
                {/* Header row */}
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    {bet.featured && (
                      <span className="badge-featured text-[9px] px-1.5 py-0.5 rounded-full font-bold mr-1">⭐ ТОП</span>
                    )}
                    <span className="badge-active text-[9px] px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
                    <h3 className="text-sm font-bold text-white mt-1.5 leading-tight line-clamp-2">{bet.title}</h3>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-bold text-white">{volume.toFixed(1)}</div>
                    <div className="text-[9px] text-white/40 flex items-center gap-0.5 justify-end">
                      <span className="text-[#0098EA]">💎</span>TON
                    </div>
                  </div>
                </div>

                {/* Price bar */}
                <div className="flex rounded-lg overflow-hidden mb-2 h-2">
                  <div className="yes-bar transition-all duration-500" style={{ width: `${yesPct}%` }} />
                  <div className="no-bar transition-all duration-500" style={{ width: `${noPct}%` }} />
                </div>

                {/* Odds */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-400 text-xs font-bold">ДА {yesPct}%</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-xs text-white/40">×{(1 / bet.yesPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-white/40">×{(1 / bet.noPrice).toFixed(2)}</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-red-400 text-xs font-bold">НЕТ {noPct}%</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/30">👥 {bet.participants.length} участников</span>
                  </div>
                  <span className="text-[10px] text-white/30">⏱ {timeLeft}</span>
                </div>

                {/* Tags */}
                {bet.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {bet.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

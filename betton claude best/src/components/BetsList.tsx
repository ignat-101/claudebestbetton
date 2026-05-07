import { useMemo } from 'react';
import { useStore, type BetCategory } from '../store/useStore';
import { BetCard } from './BetCard';

const CATEGORIES: { key: BetCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all',      label: 'Все',      emoji: '🌐' },
  { key: 'crypto',   label: 'Крипто',   emoji: '₿' },
  { key: 'sports',   label: 'Спорт',    emoji: '⚽' },
  { key: 'politics', label: 'Политика', emoji: '🏛' },
  { key: 'news',     label: 'Новости',  emoji: '📰' },
  { key: 'custom',   label: 'Другое',   emoji: '✨' },
];

export function BetsList() {
  const { bets, filterCategory, setFilterCategory, searchQuery, setSearchQuery, setSelectedBetId, setActiveTab } = useStore();

  const filtered = useMemo(() => {
    let list = bets.filter(b => b.adminApproved && b.status !== 'cancelled');
    if (filterCategory !== 'all') list = list.filter(b => b.category === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return b.createdAt - a.createdAt;
    });
  }, [bets, filterCategory, searchQuery]);

  const featured = filtered.filter(b => b.featured && b.status === 'active');
  const regular = filtered.filter(b => !(b.featured && b.status === 'active'));

  return (
    <div className="flex flex-col h-full bg-mesh">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">FlashBet <span className="ton-color">TON</span></h1>
            <p className="text-[11px] text-white/40 mt-0.5">Децентрализованные прогнозы · PoS защита</p>
          </div>
          <button
            onClick={() => setActiveTab('create')}
            className="btn-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-xl"
          >
            + Создать
          </button>
        </div>

        {/* Search */}
        <input
          className="glass-input w-full rounded-xl px-3 py-2 text-[13px] mb-3"
          placeholder="🔍 Поиск ставок..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              className={`chip flex-shrink-0 ${filterCategory === cat.key ? 'active' : ''}`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-3">
        {/* Featured */}
        {featured.length > 0 && (
          <div>
            <div className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-2 mt-1">⭐ Топ рынки</div>
            {featured.map(bet => (
              <div key={bet.id} className="mb-3">
                <BetCard bet={bet} onClick={() => setSelectedBetId(bet.id)} />
              </div>
            ))}
          </div>
        )}

        {/* Regular */}
        {regular.length > 0 && (
          <div>
            {featured.length > 0 && (
              <div className="text-[10px] text-white/30 font-semibold uppercase tracking-widest mb-2">Все ставки</div>
            )}
            {regular.map(bet => (
              <div key={bet.id} className="mb-3">
                <BetCard bet={bet} onClick={() => setSelectedBetId(bet.id)} />
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-white/40 text-sm">Ставок не найдено</p>
            <button
              className="mt-4 btn-primary text-white text-sm font-bold px-4 py-2 rounded-xl"
              onClick={() => { setFilterCategory('all'); setSearchQuery(''); }}
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

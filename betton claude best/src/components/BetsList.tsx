import { useState } from 'react';
import { useStore, BetCategory } from '../store/useStore';
import { BetCard } from './BetCard';
import { CryptoTicker } from './CryptoTicker';
import { Search, SlidersHorizontal, TrendingUp, Flame, Clock } from 'lucide-react';

const CATEGORIES: { key: BetCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Все', icon: '🌐' },
  { key: 'crypto', label: 'Крипто', icon: '₿' },
  { key: 'sports', label: 'Спорт', icon: '⚽' },
  { key: 'politics', label: 'Политика', icon: '🗳' },
  { key: 'weather', label: 'Погода', icon: '🌤' },
  { key: 'news', label: 'Новости', icon: '📰' },
  { key: 'custom', label: 'Личные', icon: '🎯' },
];

type SortMode = 'hot' | 'new' | 'volume';

export function BetsList() {
  const { bets, currentUser, setSelectedBetId, filterCategory, setFilterCategory, searchQuery, setSearchQuery } = useStore();
  const [sort, setSort] = useState<SortMode>('hot');

  const activeBets = bets.filter((b) => {
    if (b.status === 'cancelled') return false;
    if (b.status === 'pending' && !currentUser.isAdmin) return false;
    if (filterCategory !== 'all' && b.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  const sorted = [...activeBets].sort((a, b) => {
    if (sort === 'hot') return (b.totalVolume + b.participants.length * 100) - (a.totalVolume + a.participants.length * 100);
    if (sort === 'new') return b.createdAt - a.createdAt;
    if (sort === 'volume') return b.totalVolume - a.totalVolume;
    return 0;
  });

  const featured = sorted.filter((b) => b.featured && b.adminApproved && b.status === 'active');
  const rest = sorted.filter((b) => !b.featured || !b.adminApproved || b.status !== 'active');

  const totalVolume = bets.reduce((sum, b) => sum + b.totalVolume, 0);
  const activeBetsCount = bets.filter((b) => b.status === 'active' && b.adminApproved).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        {/* Stats banner */}
        <div className="glass-card p-3 mb-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-lg font-black text-purple-300">{activeBetsCount}</div>
              <div className="text-[10px] text-white/40">Активных ставок</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center flex-1">
              <div className="text-lg font-black text-yellow-400">{(totalVolume / 1000).toFixed(0)}K ⭐</div>
              <div className="text-[10px] text-white/40">Общий объем</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center flex-1">
              <div className="text-lg font-black text-emerald-400">{bets.filter(b => b.status === 'resolved').length}</div>
              <div className="text-[10px] text-white/40">Завершено</div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="glass-card px-3 py-2 mb-4 overflow-hidden">
          <CryptoTicker />
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
            placeholder="Поиск ставок..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
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

        {/* Sort tabs */}
        <div className="flex gap-2 mb-2">
          {([
            { key: 'hot', label: '🔥 Топ', icon: Flame },
            { key: 'new', label: '🆕 Новые', icon: Clock },
            { key: 'volume', label: '📊 Объем', icon: TrendingUp },
          ] as const).map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
                sort === s.key
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bets list */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4">
        {/* Featured */}
        {featured.length > 0 && sort === 'hot' && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-orange-400" />
              <span className="text-xs font-bold text-orange-400">FEATURED</span>
            </div>
            {featured.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                onClick={() => setSelectedBetId(bet.id)}
                userHasBet={currentUser.activeBets.includes(bet.id)}
              />
            ))}
          </div>
        )}

        {/* Pending admin approval */}
        {currentUser.isAdmin && bets.some((b) => b.status === 'pending') && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <SlidersHorizontal size={14} className="text-red-400 animate-pulse-glow" />
              <span className="text-xs font-bold text-red-400">
                На МОДЕРАЦИИ ({bets.filter(b => b.status === 'pending').length})
              </span>
            </div>
            {bets.filter(b => b.status === 'pending').map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                onClick={() => setSelectedBetId(bet.id)}
              />
            ))}
          </div>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <div>
            {(sort !== 'hot' || featured.length === 0) ? null : (
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-blue-400" />
                <span className="text-xs font-bold text-blue-400">ВСЕ СТАВКИ</span>
              </div>
            )}
            {rest.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                onClick={() => setSelectedBetId(bet.id)}
                userHasBet={currentUser.activeBets.includes(bet.id)}
              />
            ))}
          </div>
        )}

        {sorted.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-white/40 text-sm">Ставки не найдены</p>
            <p className="text-white/20 text-xs mt-1">Попробуйте другой фильтр</p>
          </div>
        )}
      </div>
    </div>
  );
}

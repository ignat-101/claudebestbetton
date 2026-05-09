import { useBettingStore, type BetCategory, type BetStatus } from '../store/bettingStore';
import { BetCard } from './BetCard';
import { Search } from 'lucide-react';

const CATEGORIES: { id: BetCategory | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '🌐' },
  { id: 'crypto', label: 'Crypto', emoji: '🪙' },
  { id: 'sport', label: 'Sport', emoji: '⚽' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'esports', label: 'Esports', emoji: '🎮' },
  { id: 'custom', label: 'Custom', emoji: '✨' },
];

export function DiscoverTab() {
  const {
    bets,
    filterCategory,
    filterStatus,
    searchQuery,
    setFilterCategory,
    setFilterStatus,
    setSearchQuery,
  } = useBettingStore();

  const filtered = bets.filter((b) => {
    const matchCat = filterCategory === 'all' || b.category === filterCategory;
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  });

  const featured = filtered.filter((b) => b.featured);
  const regular = filtered.filter((b) => !b.featured);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search bets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input w-full pl-9 text-sm"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ id, label, emoji }) => (
          <button
            key={id}
            onClick={() => setFilterCategory(id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
              ${filterCategory === id
                ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                : 'bg-white/3 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {(['all', 'open', 'active', 'resolved'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s as BetStatus | 'all')}
            className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-200
              ${filterStatus === s
                ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
                : 'border-white/8 text-slate-500 hover:text-slate-300'
              }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            ⚡ Featured
          </h2>
          <div className="space-y-3">
            {featured.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        </section>
      )}

      {/* All bets */}
      <section>
        {featured.length > 0 && (
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            All Bets
          </h2>
        )}
        {regular.length === 0 && featured.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-3">🔍</div>
            <p>No bets found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {regular.map((bet) => (
              <BetCard key={bet.id} bet={bet} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { useMemo } from 'react';
import { useStore, type BetCategory } from '../store/useStore';
import { BetCard } from './BetCard';

const CATEGORIES: { key: BetCategory | 'all'; label: string }[] = [
  { key: 'all',      label: '🔥 Все' },
  { key: 'crypto',   label: '₿ Крипто' },
  { key: 'sports',   label: '⚽ Спорт' },
  { key: 'politics', label: '🏛 Политика' },
  { key: 'news',     label: '📰 Новости' },
  { key: 'custom',   label: '✨ Другое' },
];

export function BetsList() {
  const { bets, filterCategory, setFilterCategory, searchQuery, setSearchQuery,
          setSelectedBetId, setActiveTab } = useStore();

  const filtered = useMemo(() => {
    let list = bets.filter(b => b.status !== 'cancelled');
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
      return b.totalVolume - a.totalVolume;
    });
  }, [bets, filterCategory, searchQuery]);

  const featured = filtered.filter(b => b.featured && b.status === 'active');
  const regular  = filtered.filter(b => !(b.featured && b.status === 'active'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
              Betton <span style={{ color: '#3b82f6' }}>TON</span>
            </h1>
            <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>Рынки предсказаний на блокчейне</p>
          </div>
          <button
            onClick={() => setActiveTab('create')}
            className="btn-primary"
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            + Создать
          </button>
        </div>

        <input
          className="search-input"
          placeholder="🔍 Поиск событий..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginBottom: 10 }}
        />

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }} className="hide-scroll">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`cat-chip ${filterCategory === cat.key ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="scroll-area" style={{ flex: 1, padding: '0 16px 16px' }}>
        {featured.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 8 }}>⭐ Популярные</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {featured.map(bet => (
                <BetCard key={bet.id} bet={bet} onClick={() => setSelectedBetId(bet.id)} />
              ))}
            </div>
          </div>
        )}

        {regular.length > 0 && (
          <div>
            {featured.length > 0 && (
              <div className="section-label" style={{ marginBottom: 8 }}>Все рынки</div>
            )}
            <div style={{ display: 'grid', gap: 10 }}>
              {regular.map(bet => (
                <BetCard key={bet.id} bet={bet} onClick={() => setSelectedBetId(bet.id)} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ marginBottom: 16 }}>Ничего не найдено</p>
            <button className="btn-primary" style={{ padding: '8px 20px' }}
              onClick={() => { setFilterCategory('all'); setSearchQuery(''); }}>
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

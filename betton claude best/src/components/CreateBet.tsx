import { useState } from 'react';
import { useStore, type BetCategory, type OracleType } from '../store/useStore';

const CATEGORIES: { key: BetCategory; label: string; emoji: string }[] = [
  { key: 'crypto',   label: 'Крипто',   emoji: '₿' },
  { key: 'sports',   label: 'Спорт',    emoji: '⚽' },
  { key: 'politics', label: 'Политика', emoji: '🏛' },
  { key: 'news',     label: 'Новости',  emoji: '📰' },
  { key: 'custom',   label: 'Другое',   emoji: '✨' },
];

const ORACLE_TYPES = [
  { key: 'vote'  as OracleType, label: '🗳 Голосование PoS', desc: 'Результат определяется сообществом' },
  { key: 'price' as OracleType, label: '📊 Ценовой оракул',  desc: 'Автоматически по цене актива' },
];

export function CreateBet() {
  const { createBet, setActiveTab, tonWalletAddress } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BetCategory>('crypto');
  const [resolveDate, setResolveDate] = useState('');
  const [oracleType, setOracleType] = useState<OracleType>('vote');
  const [oracleSymbol, setOracleSymbol] = useState('');
  const [oracleTarget, setOracleTarget] = useState('');
  const [oracleDirection, setOracleDirection] = useState<'above' | 'below'>('above');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const isConnected = !!tonWalletAddress;
  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  const handleSubmit = () => {
    setError('');
    if (!title.trim() || title.length < 5) { setError('Название должно быть не менее 5 символов'); return; }
    if (!resolveDate) { setError('Выберите дату разрешения'); return; }
    if (new Date(resolveDate).getTime() <= Date.now()) { setError('Дата должна быть в будущем'); return; }
    if (!isConnected) { setError('Подключите TON кошелёк'); return; }
    if (oracleType === 'price' && !oracleSymbol.trim()) { setError('Укажите торговый символ'); return; }

    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const result = createBet({
      title: title.trim(),
      description: description.trim(),
      category,
      resolveAt: new Date(resolveDate).getTime(),
      oracleType,
      oracleSymbol: oracleType === 'price' ? oracleSymbol.trim().toUpperCase() : undefined,
      oracleTarget: oracleType === 'price' && oracleTarget ? parseFloat(oracleTarget) : undefined,
      oracleDirection: oracleType === 'price' ? oracleDirection : undefined,
      tags,
    });

    if (result.ok) {
      setStatus('success');
      setTimeout(() => { setStatus('idle'); setActiveTab('bets'); }, 2000);
    } else {
      setError(result.error || 'Ошибка'); setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ color: '#22c55e', marginBottom: 8 }}>Событие создано!</h2>
        <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
          Ваше событие добавлено на рынок. Другие участники могут делать ставки.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Создать событие</h1>
        <p style={{ fontSize: 12, color: '#475569', margin: '3px 0 0' }}>
          Создайте предсказательный рынок для голосования сообщества
        </p>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '0 16px 16px' }}>
        {!isConnected && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: 12, marginBottom: 14 }}>
            ⚠️ Подключите TON кошелёк для создания события
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Вопрос события *</div>
          <input
            className="form-input"
            placeholder="Например: Bitcoin достигнет $150,000 до конца 2025?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
          />
          <div style={{ fontSize: 10, color: '#475569', textAlign: 'right', marginTop: 3 }}>{title.length}/200</div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Описание</div>
          <textarea
            className="form-input"
            placeholder="Опишите условия разрешения события, источники данных..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={1000}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Категория</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`cat-chip ${category === cat.key ? 'active' : ''}`}
                onClick={() => setCategory(cat.key)}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolve date */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Дата разрешения *</div>
          <input
            type="datetime-local"
            className="form-input"
            value={resolveDate}
            min={minDate}
            onChange={e => setResolveDate(e.target.value)}
          />
        </div>

        {/* Oracle type */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Тип оракула</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {ORACLE_TYPES.map(ot => (
              <button
                key={ot.key}
                onClick={() => setOracleType(ot.key)}
                style={{
                  padding: '10px 14px', borderRadius: 10, border: `1px solid ${oracleType === ot.key ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  background: oracleType === ot.key ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: oracleType === ot.key ? '#60a5fa' : '#f1f5f9' }}>{ot.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{ot.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Price oracle fields */}
        {oracleType === 'price' && (
          <div style={{ marginBottom: 14 }} className="glass-card">
            <div style={{ padding: '12px 14px' }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Настройка ценового оракула</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Символ</div>
                  <input className="form-input" placeholder="BTC" value={oracleSymbol}
                    onChange={e => setOracleSymbol(e.target.value.toUpperCase())} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Целевая цена ($)</div>
                  <input type="number" className="form-input" placeholder="100000"
                    value={oracleTarget} onChange={e => setOracleTarget(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['above', 'below'] as const).map(dir => (
                  <button key={dir} onClick={() => setOracleDirection(dir)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${oracleDirection === dir ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: oracleDirection === dir ? 'rgba(59,130,246,0.12)' : 'transparent',
                      cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      color: oracleDirection === dir ? '#60a5fa' : '#64748b',
                    }}
                  >
                    {dir === 'above' ? '📈 Выше' : '📉 Ниже'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        <div style={{ marginBottom: 14 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Теги (через запятую)</div>
          <input
            className="form-input"
            placeholder="bitcoin, крипто, 2025"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, marginBottom: 14 }}>
            ❌ {error}
          </div>
        )}

        {/* Info */}
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', marginBottom: 16, fontSize: 11, color: '#64748b' }}>
          ℹ️ Событие будет доступно сразу после создания. Результат определяется автоматически через PoS голосование или ценовой оракул.
        </div>

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!isConnected}
          style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 700 }}
        >
          🚀 Создать событие
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useStore, type BetCategory } from '../store/useStore';

const CATEGORIES: { key: BetCategory; label: string; emoji: string }[] = [
  { key: 'crypto', label: 'Крипто', emoji: '₿' },
  { key: 'sports', label: 'Спорт', emoji: '⚽' },
  { key: 'politics', label: 'Политика', emoji: '🏛' },
  { key: 'news', label: 'Новости', emoji: '📰' },
  { key: 'custom', label: 'Другое', emoji: '✨' },
];

const ORACLE_TYPES = [
  { key: 'manual', label: '👤 Ручное (Админ решает)' },
  { key: 'vote', label: '🗳 Голосование сообщества' },
  { key: 'price', label: '📊 Ценовой оракул' },
];

export function CreateBet() {
  const { createBet, setActiveTab, tonWalletAddress } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BetCategory>('crypto');
  const [resolveDate, setResolveDate] = useState('');
  const [oracleType, setOracleType] = useState<'manual' | 'vote' | 'price'>('manual');
  const [oracleSymbol, setOracleSymbol] = useState('');
  const [oracleTarget, setOracleTarget] = useState('');
  const [oracleDirection, setOracleDirection] = useState<'above' | 'below'>('above');
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const isConnected = !!tonWalletAddress;

  const minDate = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  const handleSubmit = () => {
    if (!title.trim()) { setError('Введите название события'); return; }
    if (!resolveDate) { setError('Выберите дату разрешения'); return; }
    if (!isConnected) { setError('Подключите TON кошелёк для создания ставки'); return; }

    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const result = createBet({
      title: title.trim(),
      description: description.trim(),
      category,
      resolveAt: new Date(resolveDate).getTime(),
      oracleType,
      oracleSymbol: oracleType === 'price' ? oracleSymbol : undefined,
      oracleTarget: oracleType === 'price' ? parseFloat(oracleTarget) : undefined,
      oracleDirection: oracleType === 'price' ? oracleDirection : undefined,
      tags,
    });

    if (result.ok) {
      setStatus('success');
      setTimeout(() => { setStatus('idle'); setActiveTab('bets'); }, 2000);
    } else {
      setError(result.error || 'Ошибка');
      setStatus('error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Создать рынок</h1>
        <p style={{ fontSize: 12, color: '#475569', margin: '3px 0 0' }}>
          Создайте событие для голосования сообщества
        </p>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '0 16px 16px' }}>
        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ color: '#22c55e', marginBottom: 8 }}>Заявка отправлена!</h2>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Ваш рынок проходит проверку администратора. После одобрения он появится в списке.
            </p>
          </div>
        ) : (
          <>
            {!isConnected && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.1)',
                            border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: 12, marginBottom: 14 }}>
                ⚠️ Подключите TON кошелёк для создания рынка
              </div>
            )}

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>Вопрос события *</div>
              <input
                className="form-input"
                placeholder="Bitcoin достигнет $150,000 до конца 2025?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
              />
              <div style={{ fontSize: 10, color: '#475569', textAlign: 'right', marginTop: 3 }}>
                {title.length}/200
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>Описание</div>
              <textarea
                className="form-input"
                placeholder="Опишите условия, источники данных и критерии разрешения..."
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
                {CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                             background: category === c.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                             border: `1px solid ${category === c.key ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                             color: category === c.key ? '#60a5fa' : '#94a3b8', cursor: 'pointer' }}>
                    {c.emoji} {c.label}
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
                min={minDate}
                value={resolveDate}
                onChange={e => setResolveDate(e.target.value)}
              />
            </div>

            {/* Oracle type */}
            <div style={{ marginBottom: 14 }}>
              <div className="section-label" style={{ marginBottom: 8 }}>Тип разрешения</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ORACLE_TYPES.map(o => (
                  <button
                    key={o.key}
                    onClick={() => setOracleType(o.key as 'manual' | 'vote' | 'price')}
                    style={{ padding: '9px 14px', borderRadius: 8, fontSize: 13, textAlign: 'left',
                             background: oracleType === o.key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                             border: `1px solid ${oracleType === o.key ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.07)'}`,
                             color: oracleType === o.key ? '#60a5fa' : '#94a3b8', cursor: 'pointer' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Oracle symbol (if price) */}
            {oracleType === 'price' && (
              <div className="glass-card" style={{ padding: 12, marginBottom: 14 }}>
                <div className="section-label" style={{ marginBottom: 8 }}>Настройки оракула</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Символ (BTC, ETH...)</div>
                    <input className="form-input" placeholder="BTC" value={oracleSymbol}
                           onChange={e => setOracleSymbol(e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Целевая цена (USD)</div>
                    <input type="number" className="form-input" placeholder="100000"
                           value={oracleTarget} onChange={e => setOracleTarget(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['above', 'below'] as const).map(d => (
                    <button key={d} onClick={() => setOracleDirection(d)}
                      style={{ flex: 1, padding: '7px', fontSize: 12, borderRadius: 8,
                               background: oracleDirection === d ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                               border: `1px solid ${oracleDirection === d ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                               color: oracleDirection === d ? '#60a5fa' : '#94a3b8', cursor: 'pointer' }}>
                      {d === 'above' ? '↑ Выше' : '↓ Ниже'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div style={{ marginBottom: 16 }}>
              <div className="section-label" style={{ marginBottom: 6 }}>Теги (через запятую)</div>
              <input
                className="form-input"
                placeholder="btc, bitcoin, crypto"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginBottom: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
              onClick={handleSubmit}
              disabled={!isConnected}
            >
              Отправить на проверку
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 10 }}>
              После проверки администратором рынок станет доступен всем
            </p>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useStore, BetCategory, Bet, TREASURY_WALLET_ADDRESS } from '../store/useStore';
import { SECURITY_CONFIG } from '../security/proofOfStake';
import { useTonWallet } from '@tonconnect/ui-react';

const CATEGORIES: { key: BetCategory; label: string; icon: string; desc: string }[] = [
  { key: 'crypto', label: 'Криптовалюта', icon: '₿', desc: 'BTC, ETH, TON, рыночные события' },
  { key: 'sports', label: 'Спорт', icon: '⚽', desc: 'Матчи, турниры, рекорды' },
  { key: 'politics', label: 'Политика', icon: '🗳', desc: 'Выборы, законы, решения' },
  { key: 'weather', label: 'Погода', icon: '🌤', desc: 'Температура, события' },
  { key: 'news', label: 'Новости', icon: '📰', desc: 'Мировые события' },
  { key: 'custom', label: 'Личный', icon: '🎯', desc: 'Любой вопрос' },
];

const ORACLE_TYPES = [
  {
    key: 'price',
    label: 'Ценовой оракул',
    icon: '📊',
    desc: 'Автоматическое разрешение по цене актива (CoinGecko). Нет ручного вмешательства.',
  },
  {
    key: 'vote',
    label: 'PoS голосование',
    icon: '🗳',
    desc: `Консенсус валидаторов. Квадратичное взвешивание. Кворум ${Math.round(SECURITY_CONFIG.QUORUM_THRESHOLD * 100)}%. Мин. ${SECURITY_CONFIG.MIN_VALIDATORS_FOR_RESOLUTION} валидаторов.`,
  },
  {
    key: 'manual',
    label: 'Ручное + PoS',
    icon: '👤',
    desc: 'Администратор + обязательная PoS проверка. Нельзя разрешить без кворума.',
  },
];

const DURATIONS = [
  { label: '1 день', ms: 86400000 },
  { label: '3 дня', ms: 3 * 86400000 },
  { label: '1 неделя', ms: 7 * 86400000 },
  { label: '2 недели', ms: 14 * 86400000 },
  { label: '1 месяц', ms: 30 * 86400000 },
  { label: '3 месяца', ms: 90 * 86400000 },
];

export function CreateBet() {
  const { currentUser, addBet, setActiveTab } = useStore();
  const wallet = useTonWallet();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BetCategory>('crypto');
  const [oracleType, setOracleType] = useState<'price' | 'vote' | 'manual'>('vote');
  const [oracleSymbol, setOracleSymbol] = useState('bitcoin');
  const [oracleTarget, setOracleTarget] = useState<number>(100000);
  const [oracleDirection, setOracleDirection] = useState<'above' | 'below'>('above');
  const [duration, setDuration] = useState(7 * 86400000);
  const [tags, setTags] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const canProceed = () => {
    if (step === 1) return title.length >= 10 && description.length >= 20;
    if (step === 2) return !!category;
    if (step === 3) return !!oracleType;
    return true;
  };

  const handleSubmit = () => {
    setError('');

    // Санитизация входных данных
    const cleanTitle = title.replace(/[<>]/g, '').slice(0, 120);
    const cleanDesc = description.replace(/[<>]/g, '').slice(0, 1000);
    const cleanTags = tags.split(',')
      .map((t) => t.trim().replace(/[<>]/g, '').slice(0, 20))
      .filter((t) => t.length > 0)
      .slice(0, 5);

    if (cleanTitle.length < 10) {
      setError('Заголовок слишком короткий');
      return;
    }

    const newBet: Bet = {
      id: `bet_${Date.now()}_${currentUser.id.slice(-4)}`,
      title: cleanTitle,
      description: cleanDesc,
      category,
      creatorId: currentUser.id,
      creatorUsername: currentUser.username,
      createdAt: Date.now(),
      resolveAt: Date.now() + duration,
      status: 'pending', // ВСЕГДА pending — требует одобрения администратора
      outcome: null,
      // ✅ Пулы всегда 0 при создании — нет фиктивных данных
      yesPool: 0,
      noPool: 0,
      totalVolume: 0,
      yesPrice: 0.5,
      noPrice: 0.5,
      participants: [],
      votes: [],
      comments: [],
      priceHistory: [{ time: Date.now(), yesPrice: 0.5, noPrice: 0.5, volume: 0 }],
      oracleType,
      oracleSymbol: oracleType === 'price' ? oracleSymbol : undefined,
      oracleTarget: oracleType === 'price' ? oracleTarget : undefined,
      oracleDirection: oracleType === 'price' ? oracleDirection : undefined,
      adminApproved: false, // ОБЯЗАТЕЛЬНАЯ модерация
      featured: false,
      tags: cleanTags,
      feePercent: SECURITY_CONFIG.PLATFORM_FEE_PCT * 100,
      treasuryWallet: TREASURY_WALLET_ADDRESS,
      minBetTon: SECURITY_CONFIG.MIN_BET_TON,
      maxSlippagePct: 5,
    };

    addBet(newBet);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="text-5xl mb-4 animate-float">🎉</div>
        <h2 className="text-xl font-black text-white mb-2">Ставка создана!</h2>
        <p className="text-sm text-white/50 mb-6">
          Ваша ставка отправлена на модерацию. После одобрения администратором она появится в списке.
        </p>
        <div className="glass-card p-4 w-full mb-4 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">⏳</span>
            <span className="text-xs font-bold text-yellow-300">На модерации</span>
          </div>
          <div className="text-[10px] text-white/40">
            Проверяем: точность формулировки, наличие объективных критериев разрешения, оракул.
          </div>
        </div>
        <div className="glass-card p-4 w-full mb-6 border border-blue-500/20">
          <div className="text-[10px] font-bold text-blue-300 mb-2">🔐 Защита от манипуляций</div>
          <div className="text-[10px] text-white/40 space-y-1">
            <div>• Ставка ВСЕГДА начинается с пустых пулов (0 TON)</div>
            <div>• Нет фиктивных участников и объёмов</div>
            <div>• Разрешение только через оракул или PoS кворум</div>
          </div>
        </div>
        <button
          onClick={() => { setSubmitted(false); setStep(1); setTitle(''); setDescription(''); setActiveTab('bets'); }}
          className="btn-primary px-8 py-3 rounded-xl text-white font-bold"
        >
          К списку ставок
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white mb-0.5">➕ Создать ставку</h1>
        <p className="text-[11px] text-white/40 mb-3">
          Шаг {step} из 4 — {['Описание', 'Категория', 'Оракул', 'Параметры'][step - 1]}
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-purple-500' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-3">
        {/* Wallet required notice */}
        {!wallet && (
          <div className="glass-card p-3 border border-orange-500/20">
            <div className="flex items-center gap-2">
              <span className="text-orange-400">⚠️</span>
              <span className="text-[10px] text-orange-300">Подключите TON кошелёк для создания ставок. Ставки без кошелька не принимаются.</span>
            </div>
          </div>
        )}

        {/* Step 1 — Description */}
        {step === 1 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <div className="text-xs font-bold text-white/60 mb-1.5">Заголовок ставки *</div>
              <input
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="Например: Bitcoin достигнет $150k до конца 2025?"
                value={title}
                onChange={(e) => setTitle(e.target.value.replace(/[<>]/g, ''))}
                maxLength={120}
              />
              <div className="flex justify-between text-[10px] mt-1">
                <span className={title.length < 10 ? 'text-red-400' : 'text-emerald-400'}>
                  {title.length < 10 ? `Мин. 10 символов (${10 - title.length} осталось)` : '✓ Отлично'}
                </span>
                <span className="text-white/30">{title.length}/120</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-white/60 mb-1.5">Подробное описание *</div>
              <textarea
                className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-none"
                rows={4}
                placeholder="Опишите условия ставки максимально точно. Укажите источник для проверки результата (сайт, API, документ)."
                value={description}
                onChange={(e) => setDescription(e.target.value.replace(/[<>]/g, ''))}
                maxLength={1000}
              />
              <div className="flex justify-between text-[10px] mt-1">
                <span className={description.length < 20 ? 'text-red-400' : 'text-emerald-400'}>
                  {description.length < 20 ? `Мин. 20 символов` : '✓ Готово'}
                </span>
                <span className="text-white/30">{description.length}/1000</span>
              </div>
            </div>

            <div className="glass-card p-3 border border-blue-500/20">
              <div className="text-[10px] font-bold text-blue-300 mb-1">💡 Правила создания ставок</div>
              <div className="text-[10px] text-white/40 space-y-0.5">
                <div>• Формулировка должна иметь однозначный ответ ДА/НЕТ</div>
                <div>• Укажите точный источник для проверки результата</div>
                <div>• Нельзя создавать ставки на незаконные события</div>
                <div>• Ставки проходят модерацию перед публикацией</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Category */}
        {step === 2 && (
          <div className="space-y-2 animate-fadeIn">
            <div className="text-xs font-bold text-white/60 mb-2">Выберите категорию</div>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`w-full glass-card p-3 rounded-xl text-left transition-all ${
                  category === cat.key
                    ? 'border border-purple-500/50 bg-purple-500/10'
                    : 'border border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{cat.label}</div>
                    <div className="text-[10px] text-white/40">{cat.desc}</div>
                  </div>
                  {category === cat.key && (
                    <span className="ml-auto text-purple-400">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3 — Oracle */}
        {step === 3 && (
          <div className="space-y-2 animate-fadeIn">
            <div className="text-xs font-bold text-white/60 mb-2">Как определяется результат?</div>
            {ORACLE_TYPES.map((ot) => (
              <button
                key={ot.key}
                onClick={() => setOracleType(ot.key as typeof oracleType)}
                className={`w-full glass-card p-3 rounded-xl text-left transition-all ${
                  oracleType === ot.key
                    ? 'border border-purple-500/50 bg-purple-500/10'
                    : 'border border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{ot.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white">{ot.label}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{ot.desc}</div>
                  </div>
                  {oracleType === ot.key && (
                    <span className="flex-shrink-0 text-purple-400">✓</span>
                  )}
                </div>
              </button>
            ))}

            {oracleType === 'price' && (
              <div className="glass-card p-3 border border-blue-500/20 space-y-2 animate-fadeIn">
                <div className="text-[10px] font-bold text-blue-300">Настройка ценового оракула</div>
                <div>
                  <div className="text-[10px] text-white/40 mb-1">CoinGecko ID (например: bitcoin, ethereum)</div>
                  <input
                    className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                    value={oracleSymbol}
                    onChange={(e) => setOracleSymbol(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="bitcoin"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-[10px] text-white/40 mb-1">Целевая цена ($)</div>
                    <input
                      type="number"
                      className="glass-input w-full rounded-xl px-3 py-2 text-xs"
                      value={oracleTarget}
                      onChange={(e) => setOracleTarget(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 mb-1">Направление</div>
                    <select
                      className="glass-input rounded-xl px-3 py-2 text-xs h-full"
                      value={oracleDirection}
                      onChange={(e) => setOracleDirection(e.target.value as 'above' | 'below')}
                      style={{ background: '#0f0f2d' }}
                    >
                      <option value="above">Выше ↑</option>
                      <option value="below">Ниже ↓</option>
                    </select>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-400/80">
                  ✓ Автоматическое разрешение — нет ручного вмешательства
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Parameters */}
        {step === 4 && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <div className="text-xs font-bold text-white/60 mb-2">Срок ставки</div>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.ms}
                    onClick={() => setDuration(d.ms)}
                    className={`glass-card p-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      duration === d.ms ? 'border border-purple-500/50 text-purple-300 bg-purple-500/10' : 'text-white/50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-white/60 mb-1.5">Теги (через запятую)</div>
              <input
                className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                placeholder="BTC, крипто, bull run"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Summary */}
            <div className="glass-card p-3 border border-purple-500/20">
              <div className="text-[10px] font-bold text-purple-300 mb-2">📋 Итог</div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-white/40">Название</span>
                  <span className="text-white font-medium text-right ml-4 line-clamp-1">{title || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Категория</span>
                  <span className="text-white">{CATEGORIES.find((c) => c.key === category)?.icon} {category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Оракул</span>
                  <span className="text-white">{ORACLE_TYPES.find((o) => o.key === oracleType)?.icon} {ORACLE_TYPES.find((o) => o.key === oracleType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Срок</span>
                  <span className="text-white">{DURATIONS.find((d) => d.ms === duration)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Мин. ставка</span>
                  <span className="text-white">{SECURITY_CONFIG.MIN_BET_TON} TON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Комиссия</span>
                  <span className="text-white">{SECURITY_CONFIG.PLATFORM_FEE_PCT * 100}% платформа + {SECURITY_CONFIG.VALIDATOR_REWARD_PCT * 100}% валидаторам</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Пул при старте</span>
                  <span className="text-emerald-400 font-bold">0 TON (только реальные ставки)</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="glass-card p-3 border border-red-500/30">
                <div className="text-[10px] text-red-400">❌ {error}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 flex gap-2">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-xl glass-card text-white/60 text-sm font-bold"
          >
            ← Назад
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={() => canProceed() && setStep(step + 1)}
            disabled={!canProceed()}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
              canProceed() ? 'btn-primary text-white' : 'glass-card text-white/30 cursor-not-allowed'
            }`}
          >
            Далее →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!title || !description || title.length < 10}
            className="flex-1 py-3 rounded-xl btn-primary text-white text-sm font-bold"
          >
            🚀 Отправить на модерацию
          </button>
        )}
      </div>
    </div>
  );
}

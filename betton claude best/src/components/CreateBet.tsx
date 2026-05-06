import { useState } from 'react';
import { useStore, BetCategory, Bet } from '../store/useStore';
import { Calendar, Tag, AlertCircle, CheckCircle, Zap } from 'lucide-react';

const CATEGORIES: { key: BetCategory; label: string; icon: string; desc: string }[] = [
  { key: 'crypto', label: 'Крипто', icon: '₿', desc: 'Курсы, объемы, события' },
  { key: 'sports', label: 'Спорт', icon: '⚽', desc: 'Матчи, турниры, рекорды' },
  { key: 'politics', label: 'Политика', icon: '🗳', desc: 'Выборы, законы, события' },
  { key: 'weather', label: 'Погода', icon: '🌤', desc: 'Осадки, температура' },
  { key: 'news', label: 'Новости', icon: '📰', desc: 'Текущие события' },
  { key: 'custom', label: 'Личный спор', icon: '🎯', desc: 'Любое событие' },
];

const ORACLE_TYPES: { key: 'price' | 'vote' | 'manual'; label: string; desc: string; icon: string }[] = [
  { key: 'price', label: 'Оракул цены', desc: 'Автоматически через CoinGecko API', icon: '🤖' },
  { key: 'vote', label: 'Голосование', desc: 'Proof of Stake консенсус валидаторов', icon: '🗳' },
  { key: 'manual', label: 'Ручное', desc: 'Подтверждение администратором', icon: '👤' },
];

const DURATIONS = [
  { label: '1 час', hours: 1 },
  { label: '6 часов', hours: 6 },
  { label: '1 день', hours: 24 },
  { label: '3 дня', hours: 72 },
  { label: '1 неделя', hours: 168 },
  { label: '1 месяц', hours: 720 },
  { label: '3 месяца', hours: 2160 },
];

export function CreateBet() {
  const { currentUser, addBet, setActiveTab } = useStore();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BetCategory>('crypto');
  const [oracleType, setOracleType] = useState<'price' | 'vote' | 'manual'>('vote');
  const [oracleSymbol, setOracleSymbol] = useState('');
  const [oracleTarget, setOracleTarget] = useState('');
  const [oracleDirection, setOracleDirection] = useState<'above' | 'below'>('above');
  const [durationHours, setDurationHours] = useState(24);
  const [tags, setTags] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState(100);
  const [submitted, setSubmitted] = useState(false);

  const CRYPTO_SYMBOLS = ['bitcoin', 'ethereum', 'the-open-network', 'solana', 'binancecoin', 'ripple', 'cardano', 'dogecoin'];

  const canProceed = () => {
    if (step === 1) return title.length >= 10 && description.length >= 20;
    if (step === 2) return category !== null;
    if (step === 3) return oracleType !== null;
    if (step === 4) return durationHours > 0;
    return true;
  };

  const handleSubmit = () => {
    if (currentUser.starsBalance < initialLiquidity) return;

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newBet: Bet = {
      id: `bet_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      creatorId: currentUser.id,
      creatorUsername: currentUser.username,
      createdAt: Date.now(),
      resolveAt: Date.now() + durationHours * 3600000,
      status: 'pending',
      outcome: null,
      yesPool: initialLiquidity / 2,
      noPool: initialLiquidity / 2,
      totalVolume: initialLiquidity,
      yesPrice: 0.5,
      noPrice: 0.5,
      participants: [],
      votes: [],
      comments: [],
      priceHistory: [
        { time: Date.now(), yesPrice: 0.5, noPrice: 0.5, volume: initialLiquidity },
      ],
      oracleType,
      oracleSymbol: oracleType === 'price' ? oracleSymbol : undefined,
      oracleTarget: oracleType === 'price' && oracleTarget ? Number(oracleTarget) : undefined,
      oracleDirection: oracleType === 'price' ? oracleDirection : undefined,
      adminApproved: false,
      featured: false,
      tags: tagList,
      feePercent: 5,
    };

    addBet(newBet);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 animate-fadeIn">
        <div className="glass-card p-8 text-center max-w-sm w-full border border-emerald-500/20">
          <div className="text-6xl mb-4 animate-float">🎉</div>
          <h2 className="text-xl font-black text-white mb-2">Ставка отправлена!</h2>
          <p className="text-sm text-white/50 mb-6">
            Ваша ставка отправлена на модерацию. После одобрения администратором она появится в общем списке.
          </p>
          <div className="glass-card p-3 mb-6 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-purple-400" />
              <span className="text-xs font-bold text-purple-300">Что дальше?</span>
            </div>
            <ul className="text-xs text-white/50 space-y-1 text-left">
              <li>✅ Администратор проверит ставку</li>
              <li>📢 После одобрения — ставка активна</li>
              <li>🗳 Валидаторы смогут голосовать</li>
              <li>💰 После завершения — расчет наград</li>
            </ul>
          </div>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setTitle(''); setDescription(''); setTags(''); setActiveTab('bets'); }}
            className="btn-primary w-full py-3 rounded-xl text-white font-bold"
          >
            Смотреть ставки
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white mb-1">Создать ставку</h1>
        <p className="text-xs text-white/40">Шаг {step} из 4 — {['Описание', 'Категория', 'Оракул', 'Параметры'][step - 1]}</p>

        {/* Progress */}
        <div className="flex gap-1.5 mt-3">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-24">
        {/* Step 1: Title & Description */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/60 mb-2">
                Заголовок ставки *
              </label>
              <input
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="Bitcoin достигнет $150,000 до конца 2025?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
              <div className="flex justify-between mt-1">
                <span className={`text-[10px] ${title.length < 10 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
                  {title.length < 10 ? `Минимум 10 символов (${10 - title.length} осталось)` : '✓ Отлично'}
                </span>
                <span className="text-[10px] text-white/30">{title.length}/120</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/60 mb-2">
                Подробное описание *
              </label>
              <textarea
                className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-none"
                rows={5}
                placeholder="Опишите условия ставки максимально точно. Как будет определен победитель? Какой источник данных?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                <span className={`text-[10px] ${description.length < 20 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
                  {description.length < 20 ? `Минимум 20 символов` : '✓ Отлично'}
                </span>
                <span className="text-[10px] text-white/30">{description.length}/500</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/60 mb-2">
                <Tag size={12} className="inline mr-1" />
                Теги (через запятую)
              </label>
              <input
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="BTC, Bitcoin, Crypto, Bull Run"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Tips */}
            <div className="glass-card p-4 border border-blue-500/20">
              <p className="text-xs font-bold text-blue-300 mb-2">💡 Советы для хорошей ставки</p>
              <ul className="space-y-1.5">
                {[
                  'Используйте конкретные цифры и даты',
                  'Укажите источник проверки результата',
                  'Событие должно быть объективно проверяемым',
                  'Чем понятнее условия — тем больше участников',
                ].map((tip, i) => (
                  <li key={i} className="text-xs text-white/50 flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <p className="text-sm text-white/50 mb-4">Выберите категорию ставки:</p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`glass-card p-4 text-left transition-all border ${
                    category === cat.key
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <div className="text-sm font-bold text-white">{cat.label}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{cat.desc}</div>
                  {category === cat.key && (
                    <CheckCircle size={14} className="text-purple-400 mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Oracle */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <p className="text-sm text-white/50 mb-4">Как будет определен результат?</p>
            <div className="space-y-3 mb-6">
              {ORACLE_TYPES.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setOracleType(o.key)}
                  className={`glass-card w-full p-4 text-left transition-all border flex items-center gap-4 ${
                    oracleType === o.key
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl">{o.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{o.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{o.desc}</div>
                  </div>
                  {oracleType === o.key && <CheckCircle size={16} className="text-purple-400 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* Price oracle config */}
            {oracleType === 'price' && (
              <div className="glass-card p-4 border border-yellow-500/20 space-y-4">
                <p className="text-xs font-bold text-yellow-300">⚙️ Настройка оракула цены</p>
                <div>
                  <label className="block text-xs text-white/50 mb-2">Криптовалюта</label>
                  <select
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                    value={oracleSymbol}
                    onChange={(e) => setOracleSymbol(e.target.value)}
                    style={{ background: 'rgba(15,15,45,0.9)' }}
                  >
                    <option value="">Выберите...</option>
                    {CRYPTO_SYMBOLS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">Целевая цена (USD)</label>
                  <input
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm"
                    type="number"
                    placeholder="120000"
                    value={oracleTarget}
                    onChange={(e) => setOracleTarget(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">Условие</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOracleDirection('above')}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        oracleDirection === 'above'
                          ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/10 text-white/40'
                      }`}
                    >
                      ▲ Выше цены
                    </button>
                    <button
                      onClick={() => setOracleDirection('below')}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                        oracleDirection === 'below'
                          ? 'border-red-500/60 bg-red-500/20 text-red-300'
                          : 'border-white/10 text-white/40'
                      }`}
                    >
                      ▼ Ниже цены
                    </button>
                  </div>
                </div>
              </div>
            )}

            {oracleType === 'vote' && (
              <div className="glass-card p-4 border border-purple-500/20">
                <p className="text-xs font-bold text-purple-300 mb-2">🗳 Proof of Stake голосование</p>
                <ul className="space-y-1.5">
                  {[
                    'Случайно выбранные валидаторы голосуют',
                    'Голоса взвешены по репутации и стейку',
                    'Правильные голоса вознаграждаются Stars',
                    'Защита от манипуляций через репутацию',
                  ].map((item, i) => (
                    <li key={i} className="text-xs text-white/50 flex items-center gap-1.5">
                      <span className="text-purple-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Parameters */}
        {step === 4 && (
          <div className="animate-fadeIn">
            {/* Duration */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/60 mb-3">
                <Calendar size={12} className="inline mr-1" />
                Срок ставки
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.hours}
                    onClick={() => setDurationHours(d.hours)}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      durationHours === d.hours
                        ? 'border-purple-500/60 bg-purple-500/20 text-purple-300'
                        : 'border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial liquidity */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-white/60 mb-3">
                Начальная ликвидность ⭐
              </label>
              <p className="text-[11px] text-white/40 mb-3">
                Создается рынок — ваши Stars обеспечивают начальные пулы ДА/НЕТ
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={Math.min(2000, currentUser.starsBalance)}
                  step={50}
                  value={initialLiquidity}
                  onChange={(e) => setInitialLiquidity(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="glass rounded-xl px-4 py-2 text-center min-w-[100px]">
                  <div className="text-yellow-400 font-bold">{initialLiquidity} ⭐</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {[100, 250, 500, 1000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setInitialLiquidity(Math.min(v, currentUser.starsBalance))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      initialLiquidity === v
                        ? 'border-purple-500/40 bg-purple-500/20 text-purple-300'
                        : 'border-white/10 text-white/30'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="glass-card p-4 mb-4 border border-purple-500/20">
              <p className="text-xs font-bold text-white/60 mb-3">📋 Предпросмотр ставки</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Заголовок:</span>
                  <span className="text-white/80 text-right max-w-[60%]">{title || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Категория:</span>
                  <span className="text-white/80">{CATEGORIES.find(c => c.key === category)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Оракул:</span>
                  <span className="text-white/80">{ORACLE_TYPES.find(o => o.key === oracleType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Срок:</span>
                  <span className="text-white/80">{DURATIONS.find(d => d.hours === durationHours)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Ликвидность:</span>
                  <span className="text-yellow-400 font-bold">{initialLiquidity} ⭐</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Статус после создания:</span>
                  <span className="text-red-400 font-semibold">На модерации</span>
                </div>
              </div>
            </div>

            {/* Balance warning */}
            {currentUser.starsBalance < initialLiquidity && (
              <div className="glass-card p-3 border border-red-500/30 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">
                  Недостаточно Stars! Баланс: {currentUser.starsBalance} ⭐
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex-shrink-0 p-4 glass border-t border-white/5">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl border border-white/20 text-white/60 font-semibold text-sm"
            >
              ← Назад
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 btn-primary py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
            >
              Далее →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={currentUser.starsBalance < initialLiquidity}
              className="flex-1 btn-primary py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
            >
              🚀 Создать ставку
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

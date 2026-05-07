import { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useStore, BetCategory, Bet, TREASURY_WALLET_ADDRESS } from '../store/useStore';

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
  { key: 'vote', label: 'Голосование', desc: 'Proof of Stake консенсус', icon: '🗳' },
  { key: 'manual', label: 'Ручное', desc: 'Подтверждение администратором', icon: '👤' },
];

const DURATIONS = [
  { label: '1 час', hours: 1 },
  { label: '6 часов', hours: 6 },
  { label: '1 день', hours: 24 },
  { label: '3 дня', hours: 72 },
  { label: '1 нед.', hours: 168 },
  { label: '1 мес.', hours: 720 },
];

const MIN_LIQUIDITY_TON = 0.1;

function toNano(ton: number): string {
  return Math.floor(ton * 1_000_000_000).toString();
}

function buildCommentPayload(text: string): string {
  const encoded = new TextEncoder().encode(text);
  const buf = new Uint8Array(4 + encoded.length);
  buf.set(encoded, 4);
  return btoa(String.fromCharCode(...buf));
}

export function CreateBet() {
  const { currentUser, addBet, setActiveTab } = useStore();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

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
  const [initialLiquidity, setInitialLiquidity] = useState(0.5);
  const [isTxPending, setIsTxPending] = useState(false);
  const [txError, setTxError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const CRYPTO_SYMBOLS = ['bitcoin', 'ethereum', 'the-open-network', 'solana', 'binancecoin', 'ripple', 'cardano'];

  const canProceed = () => {
    if (step === 1) return title.length >= 10 && description.length >= 20;
    if (step === 2) return category !== null;
    if (step === 3) return oracleType !== null;
    if (step === 4) return durationHours > 0 && initialLiquidity >= MIN_LIQUIDITY_TON;
    return true;
  };

  const handleSubmit = async () => {
    setTxError('');
    if (!wallet) {
      tonConnectUI.openModal();
      return;
    }

    setIsTxPending(true);
    try {
      const betId = `bet_${Date.now()}`;
      const commentText = `CREATE_BET:${betId}:${category}:${oracleType}`;

      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: TREASURY_WALLET_ADDRESS,
            amount: toNano(initialLiquidity),
            payload: buildCommentPayload(commentText),
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(tx);
      const txHash = result.boc ? btoa(result.boc).slice(0, 24) : `tx_${Date.now()}`;

      const tagList = tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);

      const newBet: Bet = {
        id: betId,
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
        treasuryWallet: TREASURY_WALLET_ADDRESS,
      };

      addBet(newBet);
      setSubmitted(true);
      console.log('Bet created with txHash:', txHash);
    } catch (err: any) {
      if (err?.message?.includes('Reject') || err?.message?.includes('User rejected')) {
        setTxError('Транзакция отменена');
      } else {
        setTxError(err?.message || 'Ошибка транзакции');
      }
    } finally {
      setIsTxPending(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 animate-fadeIn">
        <div className="glass-card p-8 text-center max-w-sm w-full border border-emerald-500/20">
          <div className="text-6xl mb-4 animate-float">🎉</div>
          <h2 className="text-xl font-black text-white mb-2">Ставка создана!</h2>
          <p className="text-sm text-white/50 mb-2">
            Транзакция отправлена в блокчейн TON. После одобрения администратором ставка появится в общем списке.
          </p>
          <div className="flex items-center justify-center gap-1.5 mb-4 text-[#0098EA]">
            <span>💎</span>
            <span className="text-sm font-bold">{initialLiquidity} TON</span>
            <span className="text-white/40 text-xs">внесено в пул</span>
          </div>
          <div className="glass-card p-3 mb-6 border border-purple-500/20">
            <ul className="text-xs text-white/50 space-y-1 text-left">
              <li>✅ Транзакция подтверждена в TON</li>
              <li>📢 Администратор проверит ставку</li>
              <li>🗳 После одобрения — ставка активна</li>
              <li>💰 Пул ликвидности создан</li>
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
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white mb-1">Создать ставку</h1>
        <p className="text-xs text-white/40">Шаг {step} из 4 — {['Описание', 'Категория', 'Оракул', 'Параметры'][step - 1]}</p>
        <div className="flex gap-1.5 mt-3">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-28 space-y-4">
        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-fadeIn space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Заголовок ставки *</label>
              <input
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="Bitcoin достигнет $150,000 до конца 2025?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
              <div className="flex justify-between mt-1">
                <span className={`text-[10px] ${title.length < 10 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
                  {title.length < 10 ? `Мин. 10 символов (${10 - title.length} осталось)` : '✓ Отлично'}
                </span>
                <span className="text-[10px] text-white/30">{title.length}/120</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Подробное описание *</label>
              <textarea
                className="glass-input w-full rounded-xl px-4 py-3 text-sm resize-none"
                rows={5}
                placeholder="Опишите условия ставки максимально точно..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
              />
              <span className={`text-[10px] ${description.length < 20 ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
                {description.length < 20 ? `Мин. 20 символов (${20 - description.length} осталось)` : '✓ Отлично'}
              </span>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-fadeIn grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`glass-card p-3 text-left transition-all ${category === cat.key ? 'border-purple-500/50 bg-purple-500/10' : ''}`}
              >
                <div className="text-2xl mb-1">{cat.icon}</div>
                <div className="text-xs font-bold text-white">{cat.label}</div>
                <div className="text-[10px] text-white/40">{cat.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="animate-fadeIn space-y-3">
            {ORACLE_TYPES.map((ot) => (
              <button
                key={ot.key}
                onClick={() => setOracleType(ot.key)}
                className={`glass-card p-4 w-full text-left transition-all ${oracleType === ot.key ? 'border-purple-500/50 bg-purple-500/10' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ot.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{ot.label}</div>
                    <div className="text-xs text-white/40">{ot.desc}</div>
                  </div>
                  {oracleType === ot.key && <span className="ml-auto text-purple-400">✓</span>}
                </div>
              </button>
            ))}
            {oracleType === 'price' && (
              <div className="glass-card p-3 space-y-2">
                <label className="block text-xs font-semibold text-white/60">Токен</label>
                <select
                  value={oracleSymbol}
                  onChange={(e) => setOracleSymbol(e.target.value)}
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <option value="" style={{ background: '#050510' }}>Выберите токен</option>
                  {CRYPTO_SYMBOLS.map((s) => (
                    <option key={s} value={s} style={{ background: '#050510' }}>{s}</option>
                  ))}
                </select>
                <label className="block text-xs font-semibold text-white/60">Целевая цена ($)</label>
                <input
                  type="number"
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="120000"
                  value={oracleTarget}
                  onChange={(e) => setOracleTarget(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setOracleDirection('above')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${oracleDirection === 'above' ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50' : 'glass-input text-white/50'}`}
                  >
                    ↑ Выше
                  </button>
                  <button
                    onClick={() => setOracleDirection('below')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${oracleDirection === 'below' ? 'bg-red-500/30 text-red-400 border border-red-500/50' : 'glass-input text-white/50'}`}
                  >
                    ↓ Ниже
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="animate-fadeIn space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Длительность</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.hours}
                    onClick={() => setDurationHours(d.hours)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${durationHours === d.hours ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'glass-input text-white/50'}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">
                Начальная ликвидность (TON)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="range"
                  min={MIN_LIQUIDITY_TON}
                  max={10}
                  step={0.1}
                  value={initialLiquidity}
                  onChange={(e) => setInitialLiquidity(Number(e.target.value))}
                  className="flex-1"
                />
                <div className="flex items-center gap-1 glass-input rounded-lg px-2 py-1.5 min-w-[80px] justify-center">
                  <span className="text-[#0098EA] text-sm">💎</span>
                  <span className="text-sm font-bold text-white">{initialLiquidity.toFixed(1)}</span>
                </div>
              </div>
              <div className="text-[10px] text-white/40">
                Эта сумма будет переведена в контракт TON как начальный пул ликвидности
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Теги (через запятую)</label>
              <input
                className="glass-input w-full rounded-xl px-4 py-3 text-sm"
                placeholder="BTC, Bitcoin, Bull Run"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Preview */}
            <div className="glass-card p-3 border border-purple-500/20">
              <div className="text-xs font-bold text-white/60 mb-2">📋 Итоговые параметры</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Ликвидность:</span>
                  <span className="text-[#0098EA] font-bold">💎 {initialLiquidity} TON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Категория:</span>
                  <span className="text-white">{CATEGORIES.find(c => c.key === category)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Оракул:</span>
                  <span className="text-white">{ORACLE_TYPES.find(o => o.key === oracleType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Длительность:</span>
                  <span className="text-white">{DURATIONS.find(d => d.hours === durationHours)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Комиссия:</span>
                  <span className="text-yellow-400">5%</span>
                </div>
              </div>
            </div>

            {txError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                ❌ {txError}
              </div>
            )}

            {!wallet && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-white/60 flex items-center gap-2">
                <span className="text-[#0098EA]">💎</span>
                Для создания ставки нужен TON кошелёк
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 px-4 pb-6 pt-3 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-xl glass-input text-white/60 font-bold text-sm"
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
            disabled={!canProceed() || isTxPending}
            className="flex-1 btn-primary py-3 rounded-xl text-white font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isTxPending ? (
              <>
                <span className="animate-spin">⚡</span>
                Отправляем в TON...
              </>
            ) : !wallet ? (
              <>💎 Подключить кошелёк</>
            ) : (
              <>💎 Создать за {initialLiquidity} TON</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

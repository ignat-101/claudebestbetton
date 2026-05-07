import { useState } from 'react';
import { useStore, type BetCategory, TREASURY_WALLET_ADDRESS } from '../store/useStore';
import { SECURITY_CONFIG } from '../security/proofOfStake';

const CATEGORIES: { key: BetCategory; label: string; emoji: string }[] = [
  { key: 'crypto',   label: 'Крипто',   emoji: '₿' },
  { key: 'sports',   label: 'Спорт',    emoji: '⚽' },
  { key: 'politics', label: 'Политика', emoji: '🏛' },
  { key: 'news',     label: 'Новости',  emoji: '📰' },
  { key: 'weather',  label: 'Погода',   emoji: '🌤' },
  { key: 'custom',   label: 'Другое',   emoji: '✨' },
];

const ORACLE_TYPES = [
  { key: 'price', label: 'Price Oracle', desc: 'Авто-разрешение по ценовому фиду', emoji: '📊' },
  { key: 'vote',  label: 'PoS Vote',     desc: 'Разрешение голосованием валидаторов', emoji: '⚖️' },
  { key: 'manual', label: 'Manual',      desc: 'Ручное разрешение администратором', emoji: '👤' },
] as const;

export function CreateBet() {
  const { currentUser, addBet, setActiveTab } = useStore();

  const [form, setForm] = useState({
    title: '', description: '', category: 'crypto' as BetCategory,
    resolveDate: '', oracleType: 'vote' as 'price' | 'vote' | 'manual',
    oracleSymbol: '', oracleTarget: '', oracleDirection: 'above' as 'above' | 'below',
    tags: '', minBet: SECURITY_CONFIG.MIN_BET_TON,
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim() || form.title.length < 10) e.title = 'Минимум 10 символов';
    if (!form.description.trim() || form.description.length < 20) e.description = 'Минимум 20 символов';
    if (!form.resolveDate) e.resolveDate = 'Укажите дату';
    else if (new Date(form.resolveDate).getTime() < Date.now() + 3600000) e.resolveDate = 'Дата должна быть как минимум через час';
    if (form.oracleType === 'price' && !form.oracleSymbol) e.oracleSymbol = 'Укажите символ';
    if (form.oracleType === 'price' && !form.oracleTarget) e.oracleTarget = 'Укажите целевую цену';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const now = Date.now();
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5);
    addBet({
      id: `bet_${now}_${Math.random().toString(36).slice(2,8)}`,
      title: form.title.trim().slice(0, 120),
      description: form.description.trim().slice(0, 800),
      category: form.category,
      creatorId: currentUser.id,
      creatorUsername: currentUser.username,
      createdAt: now,
      resolveAt: new Date(form.resolveDate).getTime(),
      status: 'pending',
      outcome: null,
      yesPool: 0, noPool: 0, totalVolume: 0,
      yesPrice: 0.5, noPrice: 0.5,
      participants: [], votes: [], comments: [],
      priceHistory: [{ time: now, yesPrice: 0.5, noPrice: 0.5, volume: 0 }],
      oracleType: form.oracleType,
      oracleSymbol: form.oracleType === 'price' ? form.oracleSymbol : undefined,
      oracleTarget: form.oracleType === 'price' ? parseFloat(form.oracleTarget) : undefined,
      oracleDirection: form.oracleType === 'price' ? form.oracleDirection : undefined,
      adminApproved: currentUser.isAdmin, // instant approval for admin
      featured: false,
      tags,
      feePercent: SECURITY_CONFIG.PLATFORM_FEE_PCT * 100,
      treasuryWallet: TREASURY_WALLET_ADDRESS,
      minBetTon: Math.max(SECURITY_CONFIG.MIN_BET_TON, form.minBet),
      maxSlippagePct: 5,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-mesh px-8 text-center">
        <div className="text-5xl mb-4 animate-float">🎉</div>
        <h2 className="text-xl font-black text-white mb-2">Ставка создана!</h2>
        <p className="text-white/50 text-sm leading-relaxed">
          {currentUser.isAdmin ? 'Ставка автоматически одобрена и опубликована.' : 'Ставка отправлена на модерацию. После одобрения она появится в списке.'}
        </p>
        <button onClick={() => setActiveTab('bets')}
          className="mt-6 btn-primary text-white text-sm font-bold px-6 py-3 rounded-xl">
          → К ставкам
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-mesh">
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <h1 className="text-xl font-black text-white mb-0.5">Создать ставку</h1>
        <p className="text-[11px] text-white/40">Ставки проходят модерацию перед публикацией</p>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-3">
        {/* Title */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Вопрос</label>
          <input
            className={`glass-input w-full rounded-xl px-3 py-2.5 text-[13px] ${errors.title ? 'border-red-500/50' : ''}`}
            placeholder="Например: Bitcoin достигнет $150k до конца года?"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          {errors.title && <p className="text-[10px] text-red-400 mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Описание и источник</label>
          <textarea
            className={`glass-input w-full rounded-xl px-3 py-2.5 text-[12px] resize-none ${errors.description ? 'border-red-500/50' : ''}`}
            rows={3}
            placeholder="Опишите условия разрешения ставки и источник информации..."
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          {errors.description && <p className="text-[10px] text-red-400 mt-1">{errors.description}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">Категория</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.key}
                onClick={() => setForm(f => ({ ...f, category: c.key }))}
                className={`chip ${form.category === c.key ? 'active' : ''}`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Oracle type */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5 block">Тип разрешения</label>
          <div className="space-y-1.5">
            {ORACLE_TYPES.map(o => (
              <button key={o.key}
                onClick={() => setForm(f => ({ ...f, oracleType: o.key }))}
                className={`w-full glass-card p-3 rounded-xl text-left transition-all ${form.oracleType === o.key ? 'ring-1 ring-purple-400/50 bg-purple-500/10' : 'hover:bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{o.emoji}</span>
                  <div>
                    <p className="text-[12px] font-bold text-white">{o.label}</p>
                    <p className="text-[10px] text-white/40">{o.desc}</p>
                  </div>
                  {form.oracleType === o.key && <span className="ml-auto text-purple-400 text-sm">✓</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Price oracle params */}
        {form.oracleType === 'price' && (
          <div className="space-y-2 animate-fadeIn">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">CoinGecko ID</label>
              <input className={`glass-input w-full rounded-xl px-3 py-2 text-[12px] ${errors.oracleSymbol ? 'border-red-500/50' : ''}`}
                placeholder="bitcoin, ethereum, the-open-network..."
                value={form.oracleSymbol}
                onChange={e => setForm(f => ({ ...f, oracleSymbol: e.target.value }))} />
              {errors.oracleSymbol && <p className="text-[10px] text-red-400 mt-1">{errors.oracleSymbol}</p>}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Цель ($)</label>
                <input type="number" className={`glass-input w-full rounded-xl px-3 py-2 text-[12px] ${errors.oracleTarget ? 'border-red-500/50' : ''}`}
                  placeholder="120000"
                  value={form.oracleTarget}
                  onChange={e => setForm(f => ({ ...f, oracleTarget: e.target.value }))} />
                {errors.oracleTarget && <p className="text-[10px] text-red-400 mt-1">{errors.oracleTarget}</p>}
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Направление</label>
                <div className="flex gap-1">
                  <button onClick={() => setForm(f => ({ ...f, oracleDirection: 'above' }))}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${form.oracleDirection === 'above' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'glass text-white/40'}`}>
                    ↑ Выше
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, oracleDirection: 'below' }))}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all ${form.oracleDirection === 'below' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'glass text-white/40'}`}>
                    ↓ Ниже
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resolve date */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Дата разрешения</label>
          <input type="datetime-local"
            className={`glass-input w-full rounded-xl px-3 py-2 text-[12px] ${errors.resolveDate ? 'border-red-500/50' : ''}`}
            value={form.resolveDate}
            min={new Date(Date.now() + 3600000).toISOString().slice(0,16)}
            onChange={e => setForm(f => ({ ...f, resolveDate: e.target.value }))} />
          {errors.resolveDate && <p className="text-[10px] text-red-400 mt-1">{errors.resolveDate}</p>}
        </div>

        {/* Tags */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Теги (через запятую)</label>
          <input className="glass-input w-full rounded-xl px-3 py-2 text-[12px]"
            placeholder="BTC, Crypto, Bull Run"
            value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
        </div>

        {/* Security note */}
        <div className="glass px-3 py-2 rounded-xl flex items-start gap-2">
          <span className="text-base">🔐</span>
          <div className="text-[10px] text-white/35 leading-relaxed">
            Все ставки проходят модерацию. Комиссия платформы {SECURITY_CONFIG.PLATFORM_FEE_PCT * 100}% · Валидаторам {SECURITY_CONFIG.VALIDATOR_REWARD_PCT * 100}%. AMM ценообразование + PoS защита.
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          className="btn-primary w-full text-white text-sm font-bold py-3 rounded-xl">
          🚀 Создать ставку
        </button>
      </div>
    </div>
  );
}

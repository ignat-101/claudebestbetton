import { useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { useBettingStore, type Bet, type BetCategory } from '../store/bettingStore';
import { useTonTransactions } from '../hooks/useTonTransactions';
import { PlusCircle, Trash2, Info } from 'lucide-react';

const CATEGORIES: { id: BetCategory; label: string; emoji: string }[] = [
  { id: 'crypto', label: 'Crypto', emoji: '🪙' },
  { id: 'sport', label: 'Sport', emoji: '⚽' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'esports', label: 'Esports', emoji: '🎮' },
  { id: 'custom', label: 'Custom', emoji: '✨' },
];

export function CreateTab() {
  const address = useTonAddress();
  const { addBet, setActiveTab } = useBettingStore();
  const { sendTon } = useTonTransactions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<BetCategory>('custom');
  const [options, setOptions] = useState(['', '']);
  const [minBet, setMinBet] = useState('0.5');
  const [maxBet, setMaxBet] = useState('50');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Creation fee in TON
  const CREATION_FEE = 0.5;

  const addOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const removeOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, val: string) => {
    setOptions(options.map((o, i) => (i === idx ? val : o)));
  };

  const handleCreate = async () => {
    if (!address) { setError('Connect your wallet first'); return; }
    if (!title.trim()) { setError('Title is required'); return; }
    if (!description.trim()) { setError('Description is required'); return; }
    if (options.some((o) => !o.trim())) { setError('All options must be filled'); return; }
    if (!deadline) { setError('Deadline is required'); return; }
    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) { setError('Deadline must be in the future'); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      // Send creation fee
      await sendTon(
        'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        CREATION_FEE,
        `betton:create:${Date.now()}`
      );

      const bet: Bet = {
        id: `bet_${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        category,
        creator: address,
        creatorAlias: `${address.slice(0, 6)}...${address.slice(-4)}`,
        options: options.map((label, i) => ({
          id: `opt_${i}`,
          label: label.trim(),
          totalStaked: 0,
          backers: 0,
        })),
        deadline: deadlineDate,
        status: 'open',
        totalPool: 0,
        minBet: parseFloat(minBet) || 0.5,
        maxBet: parseFloat(maxBet) || 50,
        createdAt: new Date(),
      };

      addBet(bet);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('discover');
      }, 2000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e?.message?.includes('cancelled') || e?.message?.includes('rejected')) {
        setError('Transaction cancelled');
      } else {
        setError(e?.message || 'Failed to create bet');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="text-5xl">🔐</div>
        <h2 className="text-white font-semibold text-lg">Connect Wallet to Create</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          You need to connect your TON wallet to create bets on Betton.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-green-400 font-bold text-xl">Bet Created!</h2>
        <p className="text-slate-400 text-sm">Redirecting to Discover...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h2 className="text-white font-bold text-lg">Create a Bet</h2>
        <span className="text-[11px] text-slate-400 glass-card-sm px-2 py-0.5">
          Fee: {CREATION_FEE} TON
        </span>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Bet Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Will Bitcoin reach $200K in 2025?"
          className="glass-input w-full"
        />
        <div className="text-right text-[10px] text-slate-500 mt-0.5">{title.length}/120</div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Describe the bet conditions clearly..."
          className="glass-input w-full resize-none"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(({ id, label, emoji }) => (
            <button
              key={id}
              onClick={() => setCategory(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                ${category === id
                  ? 'bg-blue-500/20 border-blue-400/50 text-blue-300'
                  : 'bg-white/3 border-white/10 text-slate-400 hover:text-slate-200'
                }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-slate-400">Options (min 2, max 6)</label>
          <button
            onClick={addOption}
            disabled={options.length >= 6}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add option
          </button>
        </div>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                maxLength={80}
                className="glass-input flex-1 text-sm"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(idx)}
                  className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bet limits */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Min Bet (TON)</label>
          <input
            type="number"
            value={minBet}
            onChange={(e) => setMinBet(e.target.value)}
            min="0.1"
            step="0.1"
            className="glass-input w-full text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Max Bet (TON)</label>
          <input
            type="number"
            value={maxBet}
            onChange={(e) => setMaxBet(e.target.value)}
            min="1"
            step="1"
            className="glass-input w-full text-sm"
          />
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Deadline *</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
          className="glass-input w-full text-sm"
        />
      </div>

      {/* Info */}
      <div className="glass-card-sm p-3 flex gap-2 text-xs text-slate-400">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          Bets are created on-chain via TON. A creation fee of <strong className="text-blue-300">{CREATION_FEE} TON</strong> is charged.
          Platform takes <strong className="text-blue-300">2.5%</strong> of the pool on resolution.
          There is no moderation — you are responsible for your bet's terms.
        </span>
      </div>

      {error && (
        <div className="text-red-400 text-xs glass-card-sm p-2 border border-red-400/20">
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={isSubmitting}
        className="w-full btn-primary py-3 text-sm font-semibold"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Creating bet...
          </span>
        ) : (
          `🚀 Create Bet (pay ${CREATION_FEE} TON fee)`
        )}
      </button>
    </div>
  );
}

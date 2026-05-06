import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BetCategory = 'crypto' | 'weather' | 'sports' | 'politics' | 'custom' | 'news';
export type BetStatus = 'pending' | 'active' | 'voting' | 'resolved' | 'cancelled';
export type BetOutcome = 'yes' | 'no' | null;
export type VoteChoice = 'yes' | 'no';

export interface UserBet {
  betId: string;
  userId: string;
  username: string;
  side: 'yes' | 'no';
  amount: number;
  shares: number;
  timestamp: number;
  avgPrice: number;
}

export interface Vote {
  userId: string;
  username: string;
  choice: VoteChoice;
  stake: number;
  reputation: number;
  timestamp: number;
  reward?: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
  likes: number;
}

export interface PricePoint {
  time: number;
  yesPrice: number;
  noPrice: number;
  volume: number;
}

export interface Bet {
  id: string;
  title: string;
  description: string;
  category: BetCategory;
  creatorId: string;
  creatorUsername: string;
  createdAt: number;
  resolveAt: number;
  status: BetStatus;
  outcome: BetOutcome;
  yesPool: number;
  noPool: number;
  totalVolume: number;
  yesPrice: number;
  noPrice: number;
  participants: UserBet[];
  votes: Vote[];
  comments: Comment[];
  priceHistory: PricePoint[];
  oracleType: 'price' | 'vote' | 'manual';
  oracleSymbol?: string;
  oracleTarget?: number;
  oracleDirection?: 'above' | 'below';
  adminApproved: boolean;
  featured: boolean;
  tags: string[];
  feePercent: number;
}

export interface User {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  avatar: string;
  starsBalance: number;
  tonBalance: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  reputation: number;
  activeBets: string[];
  resolvedBets: string[];
  votedBets: string[];
  referralCode: string;
  referredBy?: string;
  referrals: string[];
  referralEarnings: number;
  joinedAt: number;
  lastActive: number;
  isAdmin: boolean;
  notifications: AppNotification[];
}

export interface AppNotification {
  id: string;
  type: 'win' | 'loss' | 'vote_reward' | 'referral' | 'admin' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'bet' | 'win' | 'refund' | 'fee' | 'referral' | 'vote_reward' | 'deposit' | 'withdrawal';
  amount: number;
  betId?: string;
  timestamp: number;
  description: string;
}

export interface Treasury {
  totalBalance: number;
  totalFees: number;
  totalPaidOut: number;
  walletAddress: string;
  transactions: Transaction[];
}

interface AppState {
  activeTab: 'bets' | 'create' | 'portfolio' | 'admin' | 'profile';
  setActiveTab: (tab: 'bets' | 'create' | 'portfolio' | 'admin' | 'profile') => void;
  selectedBetId: string | null;
  setSelectedBetId: (id: string | null) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  updateUserBalance: (delta: number) => void;
  bets: Bet[];
  addBet: (bet: Bet) => void;
  updateBet: (id: string, updates: Partial<Bet>) => void;
  placeBet: (betId: string, side: 'yes' | 'no', amount: number) => boolean;
  resolveBet: (betId: string, outcome: 'yes' | 'no') => void;
  approveBet: (betId: string) => void;
  rejectBet: (betId: string) => void;
  voteOnBet: (betId: string, choice: VoteChoice) => void;
  addComment: (betId: string, text: string) => void;
  treasury: Treasury;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  cryptoPrices: Record<string, { price: number; change24h: number; symbol: string }>;
  setCryptoPrices: (prices: Record<string, { price: number; change24h: number; symbol: string }>) => void;
  filterCategory: BetCategory | 'all';
  setFilterCategory: (cat: BetCategory | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  tonWalletAddress: string | null;
  setTonWalletAddress: (addr: string | null) => void;
}

function calculateShares(poolIn: number, poolOut: number, amountIn: number): number {
  if (poolIn === 0 || poolOut === 0) return amountIn;
  const k = poolIn * poolOut;
  const newPoolIn = poolIn + amountIn;
  const newPoolOut = k / newPoolIn;
  return poolOut - newPoolOut;
}

function calcPrice(yesPool: number, noPool: number) {
  const total = yesPool + noPool;
  if (total === 0) return { yesPrice: 0.5, noPrice: 0.5 };
  return {
    yesPrice: parseFloat((noPool / total).toFixed(4)),
    noPrice: parseFloat((yesPool / total).toFixed(4)),
  };
}

const genHistory = (len: number, baseYes: number) =>
  Array.from({ length: len }, (_, i) => ({
    time: Date.now() - (len - 1 - i) * 3600000,
    yesPrice: Math.min(0.95, Math.max(0.05, baseYes + Math.sin(i * 0.5) * 0.08 + (i / len) * 0.1 - 0.05)),
    noPrice: Math.min(0.95, Math.max(0.05, (1 - baseYes) - Math.sin(i * 0.5) * 0.08 - (i / len) * 0.1 + 0.05)),
    volume: Math.floor(Math.random() * 500) + 50,
  }));

const DEMO_BETS: Bet[] = [
  {
    id: 'bet_001',
    title: 'Bitcoin достигнет $120,000 до конца июля 2025?',
    description: 'Цена BTC на Binance или CoinGecko достигнет отметки $120,000 до 31 июля 2025 года в 23:59 UTC. Результат проверяется через CoinGecko API автоматически.',
    category: 'crypto',
    creatorId: 'user_demo',
    creatorUsername: 'CryptoWhale',
    createdAt: Date.now() - 86400000 * 2,
    resolveAt: Date.now() + 86400000 * 15,
    status: 'active',
    outcome: null,
    yesPool: 8500,
    noPool: 3200,
    totalVolume: 11700,
    yesPrice: 0.27,
    noPrice: 0.73,
    participants: [],
    votes: [],
    comments: [
      { id: 'c1', userId: 'u1', username: 'TraderX', avatar: '🐋', text: 'Bull run incoming! Киты накапливаются', timestamp: Date.now() - 3600000, likes: 12 },
      { id: 'c2', userId: 'u2', username: 'BearMode', avatar: '🐻', text: 'Рынок перегрет, жду коррекцию до $90k', timestamp: Date.now() - 1800000, likes: 7 },
    ],
    priceHistory: genHistory(24, 0.27),
    oracleType: 'price',
    oracleSymbol: 'bitcoin',
    oracleTarget: 120000,
    oracleDirection: 'above',
    adminApproved: true,
    featured: true,
    tags: ['BTC', 'Bitcoin', 'Bull Run'],
    feePercent: 5,
  },
  {
    id: 'bet_002',
    title: 'Ethereum обновление Pectra — успешный запуск в Q3 2025?',
    description: 'Ethereum Foundation успешно запустит обновление Pectra в основной сети до 30 сентября 2025.',
    category: 'crypto',
    creatorId: 'user_demo2',
    creatorUsername: 'ETHMaxi',
    createdAt: Date.now() - 86400000 * 5,
    resolveAt: Date.now() + 86400000 * 60,
    status: 'active',
    outcome: null,
    yesPool: 5200,
    noPool: 7800,
    totalVolume: 13000,
    yesPrice: 0.6,
    noPrice: 0.4,
    participants: [],
    votes: [],
    comments: [],
    priceHistory: genHistory(24, 0.6),
    oracleType: 'vote',
    adminApproved: true,
    featured: true,
    tags: ['ETH', 'Ethereum', 'DeFi'],
    feePercent: 5,
  },
  {
    id: 'bet_003',
    title: 'Россия выиграет Чемпионат Мира по хоккею 2025?',
    description: 'Сборная России победит в финале ЧМ по хоккею с шайбой 2025 года.',
    category: 'sports',
    creatorId: 'user_sport',
    creatorUsername: 'HockeyStar',
    createdAt: Date.now() - 86400000,
    resolveAt: Date.now() + 86400000 * 30,
    status: 'active',
    outcome: null,
    yesPool: 12000,
    noPool: 8000,
    totalVolume: 20000,
    yesPrice: 0.4,
    noPrice: 0.6,
    participants: [],
    votes: [],
    comments: [],
    priceHistory: genHistory(24, 0.4),
    oracleType: 'vote',
    adminApproved: true,
    featured: false,
    tags: ['Хоккей', 'Спорт', 'Россия'],
    feePercent: 5,
  },
  {
    id: 'bet_004',
    title: 'TON coin войдет в топ-5 крипто по капитализации?',
    description: 'TON займет место в топ-5 по рыночной капитализации согласно CoinMarketCap до конца 2025 года.',
    category: 'crypto',
    creatorId: 'user_ton',
    creatorUsername: 'TONholder',
    createdAt: Date.now() - 86400000 * 3,
    resolveAt: Date.now() + 86400000 * 90,
    status: 'active',
    outcome: null,
    yesPool: 6800,
    noPool: 4200,
    totalVolume: 11000,
    yesPrice: 0.38,
    noPrice: 0.62,
    participants: [],
    votes: [],
    comments: [],
    priceHistory: genHistory(24, 0.38),
    oracleType: 'price',
    oracleSymbol: 'the-open-network',
    adminApproved: true,
    featured: true,
    tags: ['TON', 'Telegram', 'Top5'],
    feePercent: 5,
  },
  {
    id: 'bet_005',
    title: 'Дождь в Москве в ближайшую пятницу?',
    description: 'Выпадут ли осадки в Москве (>0.1мм) в ближайшую пятницу согласно данным OpenWeatherMap.',
    category: 'weather',
    creatorId: 'user_weather',
    creatorUsername: 'Meteorolog',
    createdAt: Date.now() - 43200000,
    resolveAt: Date.now() + 86400000 * 3,
    status: 'active',
    outcome: null,
    yesPool: 1200,
    noPool: 1800,
    totalVolume: 3000,
    yesPrice: 0.6,
    noPrice: 0.4,
    participants: [],
    votes: [],
    comments: [],
    priceHistory: genHistory(12, 0.6),
    oracleType: 'vote',
    adminApproved: true,
    featured: false,
    tags: ['Погода', 'Москва'],
    feePercent: 5,
  },
  {
    id: 'bet_006',
    title: 'SOL/USDT пробьет $300 на этой неделе?',
    description: 'Solana достигнет цены $300 против USDT на любой крупной бирже до воскресенья 23:59 UTC.',
    category: 'crypto',
    creatorId: 'user_sol',
    creatorUsername: 'SolanaTrader',
    createdAt: Date.now() - 3600000,
    resolveAt: Date.now() + 86400000 * 7,
    status: 'pending',
    outcome: null,
    yesPool: 500,
    noPool: 500,
    totalVolume: 1000,
    yesPrice: 0.5,
    noPrice: 0.5,
    participants: [],
    votes: [],
    comments: [],
    priceHistory: [],
    oracleType: 'price',
    oracleSymbol: 'solana',
    oracleTarget: 300,
    oracleDirection: 'above',
    adminApproved: false,
    featured: false,
    tags: ['SOL', 'Solana'],
    feePercent: 5,
  },
  {
    id: 'bet_007',
    title: 'Trump подпишет биткоин-резервный закон до сентября 2025?',
    description: 'Президент США Дональд Трамп официально подпишет закон о стратегическом биткоин-резерве США до 1 сентября 2025.',
    category: 'politics',
    creatorId: 'user_pol',
    creatorUsername: 'PoliWatcher',
    createdAt: Date.now() - 86400000 * 4,
    resolveAt: Date.now() + 86400000 * 45,
    status: 'active',
    outcome: null,
    yesPool: 9200,
    noPool: 6800,
    totalVolume: 16000,
    yesPrice: 0.42,
    noPrice: 0.58,
    participants: [],
    votes: [],
    comments: [],
    priceHistory: genHistory(24, 0.42),
    oracleType: 'vote',
    adminApproved: true,
    featured: true,
    tags: ['Политика', 'Bitcoin', 'США'],
    feePercent: 5,
  },
];

const DEFAULT_USER: User = {
  id: 'user_me',
  telegramId: 123456789,
  username: 'FlashBetUser',
  firstName: 'Crypto',
  lastName: 'Trader',
  avatar: '🎯',
  starsBalance: 5000,
  tonBalance: 12.5,
  totalWagered: 3200,
  totalWon: 4100,
  totalLost: 2800,
  reputation: 847,
  activeBets: [],
  resolvedBets: [],
  votedBets: [],
  referralCode: 'FLASH_X7K2M',
  referrals: ['user_a', 'user_b', 'user_c'],
  referralEarnings: 450,
  joinedAt: Date.now() - 86400000 * 30,
  lastActive: Date.now(),
  isAdmin: true,
  notifications: [
    { id: 'n1', type: 'win', title: '🎉 Вы выиграли!', message: 'Ставка на Bitcoin +450 ⭐', timestamp: Date.now() - 3600000, read: false },
    { id: 'n2', type: 'vote_reward', title: '🗳️ Награда за голосование', message: 'Правильный голос! +120 ⭐', timestamp: Date.now() - 7200000, read: false },
    { id: 'n3', type: 'referral', title: '👥 Новый реферал', message: 'SolanaKing присоединился! +50 ⭐', timestamp: Date.now() - 86400000, read: true },
  ],
};

const DEFAULT_TREASURY: Treasury = {
  totalBalance: 142580,
  totalFees: 8943,
  totalPaidOut: 98420,
  walletAddress: 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0',
  transactions: Array.from({ length: 12 }, (_, i) => ({
    id: `tx_${i}`,
    userId: 'system',
    type: (['bet', 'win', 'fee', 'refund'] as const)[i % 4],
    amount: Math.floor(Math.random() * 1000) + 50,
    timestamp: Date.now() - i * 3600000 * 2,
    description: ['Ставка создана', 'Выплата победителю', 'Комиссия платформы', 'Возврат ставки'][i % 4],
  })),
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'bets' as const,
      setActiveTab: (tab) => set({ activeTab: tab }),

      selectedBetId: null,
      setSelectedBetId: (id) => set({ selectedBetId: id }),

      currentUser: DEFAULT_USER,
      setCurrentUser: (user) => set({ currentUser: user }),
      updateUserBalance: (delta) =>
        set((s) => ({
          currentUser: { ...s.currentUser, starsBalance: Math.max(0, s.currentUser.starsBalance + delta) },
        })),

      bets: DEMO_BETS,
      addBet: (bet) => set((s) => ({ bets: [bet, ...s.bets] })),
      updateBet: (id, updates) =>
        set((s) => ({ bets: s.bets.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),

      placeBet: (betId, side, amount) => {
        const { bets, currentUser } = get();
        const bet = bets.find((b) => b.id === betId);
        if (!bet || bet.status !== 'active' || !bet.adminApproved) return false;
        if (currentUser.starsBalance < amount) return false;

        const fee = Math.floor(amount * (bet.feePercent / 100));
        const net = amount - fee;

        let newYes = bet.yesPool;
        let newNo = bet.noPool;
        let shares: number;

        if (side === 'yes') {
          shares = calculateShares(bet.yesPool, bet.noPool, net);
          newYes += net;
        } else {
          shares = calculateShares(bet.noPool, bet.yesPool, net);
          newNo += net;
        }

        const { yesPrice, noPrice } = calcPrice(newYes, newNo);

        const userBet: UserBet = {
          betId,
          userId: currentUser.id,
          username: currentUser.username,
          side,
          amount,
          shares,
          timestamp: Date.now(),
          avgPrice: side === 'yes' ? yesPrice : noPrice,
        };

        const tx: Transaction = {
          id: `tx_${Date.now()}`,
          userId: currentUser.id,
          type: 'bet',
          amount: -amount,
          betId,
          timestamp: Date.now(),
          description: `Ставка ${side === 'yes' ? 'ДА' : 'НЕТ'} — "${bet.title}"`,
        };

        set((s) => ({
          bets: s.bets.map((b) =>
            b.id === betId
              ? {
                  ...b,
                  yesPool: newYes,
                  noPool: newNo,
                  totalVolume: b.totalVolume + amount,
                  yesPrice,
                  noPrice,
                  participants: [...b.participants, userBet],
                  priceHistory: [
                    ...b.priceHistory,
                    { time: Date.now(), yesPrice, noPrice, volume: amount },
                  ],
                }
              : b
          ),
          currentUser: {
            ...s.currentUser,
            starsBalance: s.currentUser.starsBalance - amount,
            totalWagered: s.currentUser.totalWagered + amount,
            activeBets: [...new Set([...s.currentUser.activeBets, betId])],
          },
          treasury: {
            ...s.treasury,
            totalBalance: s.treasury.totalBalance + fee,
            totalFees: s.treasury.totalFees + fee,
          },
          transactions: [tx, ...s.transactions],
        }));
        return true;
      },

      resolveBet: (betId, outcome) => {
        const { bets, currentUser } = get();
        const bet = bets.find((b) => b.id === betId);
        if (!bet) return;

        const winners = bet.participants.filter((p) => p.side === outcome);
        const totalShares = winners.reduce((sum, p) => sum + p.shares, 0);
        const totalPool = bet.yesPool + bet.noPool;
        const fee = Math.floor(totalPool * 0.05);
        const prize = totalPool - fee;

        const myWin = winners.find((w) => w.userId === currentUser.id);
        const myReward = myWin && totalShares > 0 ? Math.floor((myWin.shares / totalShares) * prize) : 0;

        const txs: Transaction[] = winners.map((w) => ({
          id: `tx_win_${w.userId}_${Date.now()}`,
          userId: w.userId,
          type: 'win' as const,
          amount: totalShares > 0 ? Math.floor((w.shares / totalShares) * prize) : 0,
          betId,
          timestamp: Date.now(),
          description: `Выигрыш: "${bet.title}"`,
        }));

        set((s) => ({
          bets: s.bets.map((b) => (b.id === betId ? { ...b, status: 'resolved', outcome } : b)),
          currentUser: {
            ...s.currentUser,
            starsBalance: s.currentUser.starsBalance + myReward,
            totalWon: s.currentUser.totalWon + myReward,
            resolvedBets: [...s.currentUser.resolvedBets, betId],
            activeBets: s.currentUser.activeBets.filter((id) => id !== betId),
          },
          treasury: {
            ...s.treasury,
            totalFees: s.treasury.totalFees + fee,
            totalPaidOut: s.treasury.totalPaidOut + prize,
          },
          transactions: [...txs, ...s.transactions],
        }));
      },

      approveBet: (betId) =>
        set((s) => ({
          bets: s.bets.map((b) => (b.id === betId ? { ...b, adminApproved: true, status: 'active' } : b)),
        })),

      rejectBet: (betId) =>
        set((s) => ({
          bets: s.bets.map((b) => (b.id === betId ? { ...b, status: 'cancelled' } : b)),
        })),

      voteOnBet: (betId, choice) => {
        const { currentUser } = get();
        if (currentUser.votedBets.includes(betId)) return;
        const vote: Vote = {
          userId: currentUser.id,
          username: currentUser.username,
          choice,
          stake: Math.floor(currentUser.reputation * 0.1),
          reputation: currentUser.reputation,
          timestamp: Date.now(),
        };
        set((s) => ({
          bets: s.bets.map((b) => (b.id === betId ? { ...b, votes: [...b.votes, vote] } : b)),
          currentUser: { ...s.currentUser, votedBets: [...s.currentUser.votedBets, betId] },
        }));
      },

      addComment: (betId, text) => {
        const { currentUser } = get();
        const comment: Comment = {
          id: `c_${Date.now()}`,
          userId: currentUser.id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          text,
          timestamp: Date.now(),
          likes: 0,
        };
        set((s) => ({
          bets: s.bets.map((b) => (b.id === betId ? { ...b, comments: [...b.comments, comment] } : b)),
        }));
      },

      treasury: DEFAULT_TREASURY,
      transactions: [],
      addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),

      cryptoPrices: {},
      setCryptoPrices: (prices) => set({ cryptoPrices: prices }),

      filterCategory: 'all',
      setFilterCategory: (cat) => set({ filterCategory: cat }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      tonWalletAddress: null,
      setTonWalletAddress: (addr) => set({ tonWalletAddress: addr }),
    }),
    {
      name: 'flashbet-store-v2',
      partialize: (state) => ({
        currentUser: state.currentUser,
        bets: state.bets,
        transactions: state.transactions,
        tonWalletAddress: state.tonWalletAddress,
      }),
    }
  )
);

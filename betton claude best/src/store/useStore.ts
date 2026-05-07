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
  amount: number; // in TON (real)
  shares: number;
  timestamp: number;
  avgPrice: number;
  txHash?: string; // real TON tx hash
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
  yesPool: number; // in TON
  noPool: number;  // in TON
  totalVolume: number; // in TON
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
  // TON treasury wallet where bets are sent
  treasuryWallet: string;
}

export interface User {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  avatar: string;
  tonBalance: number; // display only - real balance from wallet
  totalWagered: number; // in TON
  totalWon: number; // in TON
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
  amount: number; // in TON
  betId?: string;
  timestamp: number;
  description: string;
  txHash?: string;
}

const TREASURY_WALLET = 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';

function calcPrice(yesPool: number, noPool: number) {
  const total = yesPool + noPool;
  if (total === 0) return { yesPrice: 0.5, noPrice: 0.5 };
  return {
    yesPrice: parseFloat((noPool / total).toFixed(4)),
    noPrice: parseFloat((yesPool / total).toFixed(4)),
  };
}

function calculateShares(poolIn: number, poolOut: number, amountIn: number): number {
  if (poolIn === 0 || poolOut === 0) return amountIn;
  const k = poolIn * poolOut;
  const newPoolIn = poolIn + amountIn;
  const newPoolOut = k / newPoolIn;
  return poolOut - newPoolOut;
}

const genHistory = (len: number, baseYes: number) =>
  Array.from({ length: len }, (_, i) => ({
    time: Date.now() - (len - 1 - i) * 3600000,
    yesPrice: Math.min(0.95, Math.max(0.05, baseYes + Math.sin(i * 0.5) * 0.08 + (i / len) * 0.1 - 0.05)),
    noPrice: Math.min(0.95, Math.max(0.05, (1 - baseYes) - Math.sin(i * 0.5) * 0.08 - (i / len) * 0.1 + 0.05)),
    volume: Math.floor(Math.random() * 50) + 5,
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
    yesPool: 85.5,
    noPool: 32.0,
    totalVolume: 117.5,
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
    treasuryWallet: TREASURY_WALLET,
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
    yesPool: 52.0,
    noPool: 78.0,
    totalVolume: 130.0,
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
    treasuryWallet: TREASURY_WALLET,
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
    yesPool: 120.0,
    noPool: 80.0,
    totalVolume: 200.0,
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
    treasuryWallet: TREASURY_WALLET,
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
    yesPool: 68.0,
    noPool: 42.0,
    totalVolume: 110.0,
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
    treasuryWallet: TREASURY_WALLET,
  },
  {
    id: 'bet_005',
    title: 'Trump подпишет биткоин-резервный закон до сентября 2025?',
    description: 'Президент США Дональд Трамп официально подпишет закон о стратегическом биткоин-резерве США до 1 сентября 2025.',
    category: 'politics',
    creatorId: 'user_pol',
    creatorUsername: 'PoliWatcher',
    createdAt: Date.now() - 86400000 * 4,
    resolveAt: Date.now() + 86400000 * 45,
    status: 'active',
    outcome: null,
    yesPool: 92.0,
    noPool: 68.0,
    totalVolume: 160.0,
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
    treasuryWallet: TREASURY_WALLET,
  },
];

const DEFAULT_USER: User = {
  id: 'user_me',
  telegramId: 0,
  username: 'Player',
  firstName: 'TON',
  lastName: 'Bettor',
  avatar: '🎯',
  tonBalance: 0,
  totalWagered: 0,
  totalWon: 0,
  totalLost: 0,
  reputation: 100,
  activeBets: [],
  resolvedBets: [],
  votedBets: [],
  referralCode: 'FLASH_X7K2M',
  referrals: [],
  referralEarnings: 0,
  joinedAt: Date.now(),
  lastActive: Date.now(),
  isAdmin: false,
  notifications: [],
};

interface AppState {
  activeTab: 'bets' | 'create' | 'portfolio' | 'admin' | 'profile';
  setActiveTab: (tab: 'bets' | 'create' | 'portfolio' | 'admin' | 'profile') => void;

  selectedBetId: string | null;
  setSelectedBetId: (id: string | null) => void;

  currentUser: User;
  setCurrentUser: (user: User) => void;

  bets: Bet[];
  addBet: (bet: Bet) => void;
  updateBet: (id: string, updates: Partial<Bet>) => void;

  // placeBet now just records the bet client-side after on-chain tx confirmed
  recordBet: (betId: string, side: 'yes' | 'no', amount: number, txHash: string) => void;
  resolveBet: (betId: string, outcome: 'yes' | 'no') => void;
  approveBet: (betId: string) => void;
  rejectBet: (betId: string) => void;
  voteOnBet: (betId: string, choice: VoteChoice) => void;
  addComment: (betId: string, text: string) => void;

  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;

  cryptoPrices: Record<string, { usd: number; usd_24h_change?: number }>;
  setCryptoPrices: (prices: Record<string, { usd: number; usd_24h_change?: number }>) => void;

  filterCategory: BetCategory | 'all';
  setFilterCategory: (cat: BetCategory | 'all') => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  tonWalletAddress: string | null;
  setTonWalletAddress: (addr: string | null) => void;

  pendingTxBetId: string | null;
  pendingTxSide: 'yes' | 'no' | null;
  pendingTxAmount: number;
  setPendingTx: (betId: string | null, side: 'yes' | 'no' | null, amount: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'bets' as const,
      setActiveTab: (tab) => set({ activeTab: tab }),

      selectedBetId: null,
      setSelectedBetId: (id) => set({ selectedBetId: id }),

      currentUser: DEFAULT_USER,
      setCurrentUser: (user) => set({ currentUser: user }),

      bets: DEMO_BETS,
      addBet: (bet) => set((s) => ({ bets: [bet, ...s.bets] })),
      updateBet: (id, updates) =>
        set((s) => ({
          bets: s.bets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      recordBet: (betId, side, amount, txHash) => {
        const { bets, currentUser } = get();
        const bet = bets.find((b) => b.id === betId);
        if (!bet) return;

        const newYes = side === 'yes' ? bet.yesPool + amount : bet.yesPool;
        const newNo = side === 'no' ? bet.noPool + amount : bet.noPool;
        const shares = calculateShares(
          side === 'yes' ? bet.yesPool : bet.noPool,
          side === 'yes' ? bet.noPool : bet.yesPool,
          amount
        );
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
          txHash,
        };

        const tx: Transaction = {
          id: `tx_${Date.now()}`,
          userId: currentUser.id,
          type: 'bet',
          amount,
          betId,
          timestamp: Date.now(),
          description: `Ставка ${side === 'yes' ? 'ДА' : 'НЕТ'} на "${bet.title}"`,
          txHash,
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
            totalWagered: s.currentUser.totalWagered + amount,
            activeBets: [...new Set([...s.currentUser.activeBets, betId])],
            notifications: [
              {
                id: `n_${Date.now()}`,
                type: 'system',
                title: '✅ Ставка принята!',
                message: `${amount} TON на ${side === 'yes' ? 'ДА' : 'НЕТ'} — tx: ${txHash.slice(0, 8)}...`,
                timestamp: Date.now(),
                read: false,
              },
              ...s.currentUser.notifications,
            ],
          },
          transactions: [tx, ...s.transactions],
        }));
      },

      resolveBet: (betId, outcome) => {
        const { bets, currentUser } = get();
        const bet = bets.find((b) => b.id === betId);
        if (!bet) return;

        const winners = bet.participants.filter((p) => p.side === outcome);
        const totalShares = winners.reduce((sum, p) => sum + p.shares, 0);
        const totalPool = bet.yesPool + bet.noPool;
        const fee = totalPool * 0.05;
        const prize = totalPool - fee;
        const myWin = winners.find((w) => w.userId === currentUser.id);
        const myReward = myWin && totalShares > 0 ? (myWin.shares / totalShares) * prize : 0;

        const notification: AppNotification = myReward > 0
          ? {
              id: `n_${Date.now()}`,
              type: 'win',
              title: '🎉 Вы выиграли!',
              message: `+${myReward.toFixed(3)} TON — "${bet.title}"`,
              timestamp: Date.now(),
              read: false,
            }
          : {
              id: `n_${Date.now()}`,
              type: 'loss',
              title: '😔 Ставка проиграла',
              message: `"${bet.title}"`,
              timestamp: Date.now(),
              read: false,
            };

        set((s) => ({
          bets: s.bets.map((b) =>
            b.id === betId ? { ...b, status: 'resolved', outcome } : b
          ),
          currentUser: {
            ...s.currentUser,
            totalWon: s.currentUser.totalWon + myReward,
            resolvedBets: [...s.currentUser.resolvedBets, betId],
            activeBets: s.currentUser.activeBets.filter((id) => id !== betId),
            notifications: [notification, ...s.currentUser.notifications],
          },
        }));
      },

      approveBet: (betId) =>
        set((s) => ({
          bets: s.bets.map((b) =>
            b.id === betId ? { ...b, adminApproved: true, status: 'active' } : b
          ),
        })),

      rejectBet: (betId) =>
        set((s) => ({
          bets: s.bets.map((b) =>
            b.id === betId ? { ...b, status: 'cancelled' } : b
          ),
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
          bets: s.bets.map((b) =>
            b.id === betId ? { ...b, votes: [...b.votes, vote] } : b
          ),
          currentUser: {
            ...s.currentUser,
            votedBets: [...s.currentUser.votedBets, betId],
          },
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
          bets: s.bets.map((b) =>
            b.id === betId ? { ...b, comments: [...b.comments, comment] } : b
          ),
        }));
      },

      transactions: [],
      addTransaction: (tx) =>
        set((s) => ({ transactions: [tx, ...s.transactions] })),

      cryptoPrices: {},
      setCryptoPrices: (prices) => set({ cryptoPrices: prices }),

      filterCategory: 'all',
      setFilterCategory: (cat) => set({ filterCategory: cat }),

      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      tonWalletAddress: null,
      setTonWalletAddress: (addr) => set({ tonWalletAddress: addr }),

      pendingTxBetId: null,
      pendingTxSide: null,
      pendingTxAmount: 0,
      setPendingTx: (betId, side, amount) =>
        set({ pendingTxBetId: betId, pendingTxSide: side, pendingTxAmount: amount }),
    }),
    {
      name: 'flashbet-ton-v3',
      partialize: (state) => ({
        currentUser: state.currentUser,
        bets: state.bets,
        transactions: state.transactions,
        tonWalletAddress: state.tonWalletAddress,
      }),
    }
  )
);

export const TREASURY_WALLET_ADDRESS = TREASURY_WALLET;

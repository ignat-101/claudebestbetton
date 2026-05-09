import { create } from 'zustand';

export type BetStatus = 'open' | 'active' | 'resolved' | 'cancelled';
export type BetCategory = 'sport' | 'crypto' | 'politics' | 'esports' | 'custom';

export interface BetOption {
  id: string;
  label: string;
  totalStaked: number; // in TON
  backers: number;
}

export interface Bet {
  id: string;
  title: string;
  description: string;
  category: BetCategory;
  creator: string; // wallet address
  creatorAlias: string;
  options: BetOption[];
  deadline: Date;
  status: BetStatus;
  totalPool: number; // TON
  minBet: number; // TON
  maxBet: number; // TON
  createdAt: Date;
  resolvedOption?: string;
  txHash?: string;
  featured?: boolean;
}

export interface UserBet {
  betId: string;
  optionId: string;
  amount: number; // TON
  timestamp: Date;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'won' | 'lost';
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win';
  amount: number;
  timestamp: Date;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  description: string;
}

interface BettingState {
  bets: Bet[];
  userBets: UserBet[];
  transactions: Transaction[];
  tonBalance: number;
  isLoadingBalance: boolean;
  activeTab: 'discover' | 'create' | 'my-bets' | 'wallet';
  filterCategory: BetCategory | 'all';
  filterStatus: BetStatus | 'all';
  searchQuery: string;

  setActiveTab: (tab: BettingState['activeTab']) => void;
  setFilterCategory: (cat: BettingState['filterCategory']) => void;
  setFilterStatus: (status: BettingState['filterStatus']) => void;
  setSearchQuery: (q: string) => void;
  setTonBalance: (balance: number) => void;
  setIsLoadingBalance: (loading: boolean) => void;
  addBet: (bet: Bet) => void;
  placeBet: (betId: string, optionId: string, amount: number, txHash?: string) => void;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  updateBetStatus: (betId: string, status: BetStatus, resolvedOption?: string) => void;
}

const DEMO_BETS: Bet[] = [
  {
    id: 'bet_001',
    title: 'Bitcoin above $100K by end of Q3 2025?',
    description: 'Will Bitcoin (BTC) price exceed $100,000 USD before September 30, 2025?',
    category: 'crypto',
    creator: 'UQBvW8Y5FpMlS3V6gYqfP...Rm',
    creatorAlias: 'CryptoWatcher',
    options: [
      { id: 'yes', label: '✅ Yes, above $100K', totalStaked: 124.5, backers: 43 },
      { id: 'no', label: '❌ No, stays below', totalStaked: 87.3, backers: 31 },
    ],
    deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    status: 'open',
    totalPool: 211.8,
    minBet: 0.5,
    maxBet: 50,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    featured: true,
  },
  {
    id: 'bet_002',
    title: 'TON price end of 2025',
    description: 'Will The Open Network (TON) token be above $10 by December 31, 2025?',
    category: 'crypto',
    creator: 'UQCx...7Hk',
    creatorAlias: 'TonMaxi',
    options: [
      { id: 'above10', label: '🚀 Above $10', totalStaked: 65.0, backers: 22 },
      { id: 'below10', label: '📉 Below $10', totalStaked: 48.5, backers: 18 },
    ],
    deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    status: 'open',
    totalPool: 113.5,
    minBet: 1,
    maxBet: 100,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    featured: true,
  },
  {
    id: 'bet_003',
    title: 'Real Madrid wins Champions League 2025?',
    description: 'Will Real Madrid win the UEFA Champions League in the 2024-25 season?',
    category: 'sport',
    creator: 'UQD9...Ps',
    creatorAlias: 'FootballFan',
    options: [
      { id: 'yes', label: '⚽ Yes, they win', totalStaked: 210.0, backers: 67 },
      { id: 'no', label: '🏳️ No, eliminated', totalStaked: 143.7, backers: 52 },
    ],
    deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    status: 'open',
    totalPool: 353.7,
    minBet: 0.5,
    maxBet: 200,
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    featured: false,
  },
  {
    id: 'bet_004',
    title: 'Trump win 2026 midterms?',
    description: 'Will the Republican Party maintain House majority in 2026 US midterm elections?',
    category: 'politics',
    creator: 'UQBm...Lz',
    creatorAlias: 'PoliticsGuru',
    options: [
      { id: 'republican', label: '🔴 Republicans keep House', totalStaked: 95.2, backers: 34 },
      { id: 'democrat', label: '🔵 Democrats flip House', totalStaked: 112.8, backers: 41 },
    ],
    deadline: new Date(Date.now() + 60 * 24 * 3600 * 1000),
    status: 'open',
    totalPool: 208.0,
    minBet: 1,
    maxBet: 50,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    featured: false,
  },
  {
    id: 'bet_005',
    title: 'Team Spirit wins ESL Pro League S22?',
    description: 'Will Team Spirit take the title at ESL Pro League Season 22?',
    category: 'esports',
    creator: 'UQAk...Wq',
    creatorAlias: 'CS2Pro',
    options: [
      { id: 'yes', label: '🏆 Spirit wins', totalStaked: 30.5, backers: 15 },
      { id: 'no', label: '❌ Other team wins', totalStaked: 44.0, backers: 20 },
    ],
    deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    status: 'open',
    totalPool: 74.5,
    minBet: 0.1,
    maxBet: 20,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000),
    featured: false,
  },
];

export const useBettingStore = create<BettingState>((set) => ({
  bets: DEMO_BETS,
  userBets: [],
  transactions: [],
  tonBalance: 0,
  isLoadingBalance: false,
  activeTab: 'discover',
  filterCategory: 'all',
  filterStatus: 'all',
  searchQuery: '',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setFilterCategory: (cat) => set({ filterCategory: cat }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setTonBalance: (balance) => set({ tonBalance: balance }),
  setIsLoadingBalance: (loading) => set({ isLoadingBalance: loading }),

  addBet: (bet) => set((state) => ({ bets: [bet, ...state.bets] })),

  placeBet: (betId, optionId, amount, txHash) =>
    set((state) => {
      const newUserBet: UserBet = {
        betId,
        optionId,
        amount,
        timestamp: new Date(),
        txHash,
        status: txHash ? 'confirmed' : 'pending',
      };
      const updatedBets = state.bets.map((bet) => {
        if (bet.id !== betId) return bet;
        return {
          ...bet,
          totalPool: bet.totalPool + amount,
          options: bet.options.map((opt) => {
            if (opt.id !== optionId) return opt;
            return { ...opt, totalStaked: opt.totalStaked + amount, backers: opt.backers + 1 };
          }),
        };
      });
      return { userBets: [newUserBet, ...state.userBets], bets: updatedBets };
    }),

  addTransaction: (tx) => set((state) => ({ transactions: [tx, ...state.transactions] })),

  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)),
    })),

  updateBetStatus: (betId, status, resolvedOption) =>
    set((state) => ({
      bets: state.bets.map((bet) =>
        bet.id === betId ? { ...bet, status, resolvedOption } : bet
      ),
    })),
}));

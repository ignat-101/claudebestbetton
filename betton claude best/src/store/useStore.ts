import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────
export type BetCategory = 'crypto' | 'weather' | 'sports' | 'politics' | 'custom' | 'news';
export type BetStatus = 'pending' | 'active' | 'voting' | 'resolved' | 'cancelled';
export type BetOutcome = 'yes' | 'no' | null;

export interface UserBet {
  betId: string;
  userId: string;
  walletAddress: string;
  username: string;
  side: 'yes' | 'no';
  amount: number;
  shares: number;
  timestamp: number;
  avgPrice: number;
  txHash: string;
  confirmed: boolean;
}

export interface PricePoint {
  time: number;
  yesPrice: number;
  noPrice: number;
  volume: number;
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

export interface Vote {
  id: string;
  userId: string;
  walletAddress: string;
  choice: 'yes' | 'no';
  stake: number;
  timestamp: number;
  weight: number;
}

export interface TonDomain {
  domain: string;
  verified: boolean;
  linkedAt: number;
}

export interface AppNotification {
  id: string;
  type: 'win' | 'loss' | 'vote_reward' | 'referral' | 'admin' | 'system' | 'security';
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
  txHash?: string;
  onChainConfirmed: boolean;
}

export interface User {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  avatar: string;
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
  walletAddress?: string;
  tonDomains: TonDomain[];
  bio?: string;
  profilePublic: boolean;
  winStreak: number;
  maxWinStreak: number;
  rank: 'novice' | 'player' | 'expert' | 'legend' | 'whale';
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
  treasuryWallet: string;
  minBetTon: number;
  maxSlippagePct: number;
}

export interface FinancialMetrics {
  totalVolume: number;
  totalFees: number;
  totalPayouts: number;
  activeBetsCount: number;
  resolvedBetsCount: number;
  platformRevenue: number;
  avgBetSize: number;
  dailyVolume: number;
  weeklyVolume: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
export const TREASURY_WALLET = 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';
export const PLATFORM_FEE_PCT = 0.02;
export const MIN_BET_TON = 0.1;

export function computeRank(rep: number): User['rank'] {
  if (rep >= 1000) return 'whale';
  if (rep >= 500) return 'legend';
  if (rep >= 200) return 'expert';
  if (rep >= 50) return 'player';
  return 'novice';
}

export const RANK_META: Record<User['rank'], { label: string; emoji: string; color: string }> = {
  novice:  { label: 'Новичок',  emoji: '🌱', color: 'text-gray-400' },
  player:  { label: 'Игрок',    emoji: '🎯', color: 'text-blue-400' },
  expert:  { label: 'Эксперт',  emoji: '⭐', color: 'text-purple-400' },
  legend:  { label: 'Легенда',  emoji: '🏆', color: 'text-amber-400' },
  whale:   { label: 'Кит',      emoji: '🐳', color: 'text-emerald-400' },
};

// AMM price calculation
function calcAmmPrice(yesPool: number, noPool: number): { yes: number; no: number } {
  const total = yesPool + noPool;
  if (total === 0) return { yes: 0.5, no: 0.5 };
  return {
    yes: noPool / total,
    no: yesPool / total,
  };
}

function calcShares(amount: number, pool: number, oppositePool: number): number {
  const k = pool * oppositePool;
  const newOpposite = k / (pool + amount);
  return oppositePool - newOpposite;
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────
const NOW = Date.now();
const DAY = 86400000;

function makePriceHistory(days: number, startYes: number): PricePoint[] {
  const pts: PricePoint[] = [];
  let y = startYes;
  for (let i = days; i >= 0; i--) {
    y = Math.min(0.97, Math.max(0.03, y + (Math.random() - 0.5) * 0.06));
    pts.push({
      time: NOW - i * DAY / 4,
      yesPrice: y,
      noPrice: 1 - y,
      volume: Math.random() * 50 + 5,
    });
  }
  return pts;
}

function makeBet(
  id: string, title: string, desc: string, cat: BetCategory,
  yesPool: number, noPool: number, resolveInDays: number,
  status: BetStatus = 'active', featured = false,
  oracleType: 'price' | 'vote' | 'manual' = 'manual',
  tags: string[] = [],
  participants: UserBet[] = [],
): Bet {
  const prices = calcAmmPrice(yesPool, noPool);
  return {
    id, title, description: desc, category: cat,
    creatorId: 'admin', creatorUsername: 'FlashBet',
    createdAt: NOW - DAY * 2,
    resolveAt: NOW + DAY * resolveInDays,
    status, outcome: null,
    yesPool, noPool,
    totalVolume: yesPool + noPool,
    yesPrice: prices.yes, noPrice: prices.no,
    participants,
    votes: [], comments: [],
    priceHistory: makePriceHistory(20, prices.yes),
    oracleType,
    adminApproved: true, featured,
    tags,
    feePercent: PLATFORM_FEE_PCT,
    treasuryWallet: TREASURY_WALLET,
    minBetTon: MIN_BET_TON,
    maxSlippagePct: 0.05,
  };
}

const DEMO_PARTICIPANTS: UserBet[] = [
  {
    betId: 'b1', userId: 'u2', walletAddress: 'EQ...abc', username: 'crypto_whale',
    side: 'yes', amount: 150, shares: 120, timestamp: NOW - DAY, avgPrice: 0.62,
    txHash: 'tx1', confirmed: true,
  },
  {
    betId: 'b1', userId: 'u3', walletAddress: 'EQ...def', username: 'moon_hunter',
    side: 'no', amount: 80, shares: 65, timestamp: NOW - DAY * 0.5, avgPrice: 0.38,
    txHash: 'tx2', confirmed: true,
  },
  {
    betId: 'b2', userId: 'u2', walletAddress: 'EQ...abc', username: 'crypto_whale',
    side: 'yes', amount: 200, shares: 180, timestamp: NOW - DAY * 1.5, avgPrice: 0.71,
    txHash: 'tx3', confirmed: true,
  },
];

export const DEMO_USERS: User[] = [
  {
    id: 'u2', telegramId: 1002, username: 'crypto_whale', firstName: 'Alex',
    avatar: '🐳', tonBalance: 2500, totalWagered: 4200, totalWon: 5100, totalLost: 1900,
    reputation: 850, activeBets: ['b1', 'b2'], resolvedBets: ['b3', 'b4', 'b5'],
    votedBets: [], referralCode: 'WHALE1', referrals: ['u5'], referralEarnings: 42,
    joinedAt: NOW - DAY * 120, lastActive: NOW - 3600000,
    isAdmin: false, notifications: [],
    walletAddress: 'EQD_abc123def456ghi789',
    tonDomains: [{ domain: 'alexwhale.ton', verified: true, linkedAt: NOW - DAY * 30 }],
    bio: 'Trading since 2021. Crypto maximalist.',
    profilePublic: true, winStreak: 4, maxWinStreak: 8,
    rank: 'legend',
  },
  {
    id: 'u3', telegramId: 1003, username: 'moon_hunter', firstName: 'Maria',
    avatar: '🌙', tonBalance: 890, totalWagered: 1200, totalWon: 980, totalLost: 620,
    reputation: 320, activeBets: ['b1'], resolvedBets: ['b6'],
    votedBets: [], referralCode: 'MOON22', referrals: [], referralEarnings: 0,
    joinedAt: NOW - DAY * 45, lastActive: NOW - 7200000,
    isAdmin: false, notifications: [],
    tonDomains: [],
    bio: 'To the moon! 🚀',
    profilePublic: true, winStreak: 2, maxWinStreak: 5,
    rank: 'expert',
  },
];

const INITIAL_BETS: Bet[] = [
  makeBet('b1', 'Bitcoin достигнет $120,000 до конца июля 2025?', 
    'Достигнет ли BTC отметки $120,000 до 31 июля 2025 года? Решение по данным CoinGecko.',
    'crypto', 1840, 760, 18, 'active', true, 'price', ['btc', 'bitcoin', 'crypto'],
    DEMO_PARTICIPANTS.slice(0, 2)),

  makeBet('b2', 'TON войдёт в топ-5 по капитализации в 2025?',
    'Войдёт ли Toncoin в топ-5 криптовалют по рыночной капитализации до конца 2025 года?',
    'crypto', 3200, 1100, 45, 'active', true, 'price', ['ton', 'toncoin'],
    [DEMO_PARTICIPANTS[2]]),

  makeBet('b3', 'Ethereum перейдёт на proof-of-stake x2 до августа?',
    'Удвоится ли количество валидаторов Ethereum до 1 августа 2025?',
    'crypto', 450, 890, 10, 'active', false, 'manual', ['eth', 'ethereum']),

  makeBet('b4', 'Реал Мадрид выиграет Лигу Чемпионов 2025?',
    'Станет ли ФК Реал Мадрид победителем ЛЧ сезона 2024/25?',
    'sports', 2100, 1800, 30, 'active', false, 'manual', ['football', 'ucl', 'real']),

  makeBet('b5', 'Трамп подпишет новый крипто-закон до сентября 2025?',
    'Подпишет ли президент США новый законопроект о регулировании криптовалют до 1 сентября?',
    'politics', 980, 1420, 55, 'active', true, 'manual', ['usa', 'trump', 'crypto-law']),

  makeBet('b6', 'Mbappe забьёт 30+ голов в сезоне Ла Лига?',
    'Забьёт ли Килиан Мбаппе 30 или больше голов в текущем сезоне Ла Лиги?',
    'sports', 670, 430, 25, 'active', false, 'manual', ['football', 'mbappe', 'laliga']),

  makeBet('b7', 'Цена TON превысит $10 до конца 2025?',
    'Достигнет ли цена Toncoin отметки $10 USD до 31 декабря 2025 года?',
    'crypto', 5400, 2200, 90, 'active', true, 'price', ['ton', 'price']),

  makeBet('b8', 'Apple выпустит AR-очки в 2025 году?',
    'Выпустит ли Apple новые AR/VR очки до конца 2025 года?',
    'news', 340, 780, 120, 'active', false, 'manual', ['apple', 'ar', 'tech']),

  makeBet('b9', 'Золото превысит $3500 за унцию?',
    'Достигнет ли цена золота $3500 за унцию в 2025 году?',
    'crypto', 1200, 900, 60, 'active', false, 'price', ['gold', 'commodities']),

  makeBet('b10', 'Сборная России выйдет на ЧМ 2026?',
    'Квалифицируется ли сборная России по футболу на Чемпионат Мира 2026?',
    'sports', 120, 890, 200, 'active', false, 'manual', ['football', 'russia', 'wc2026']),
];

// ─── Default User ──────────────────────────────────────────────────────────────
const makeDefaultUser = (): User => ({
  id: `user_${Date.now()}`,
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
  referralCode: `FB_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  referrals: [],
  referralEarnings: 0,
  joinedAt: Date.now(),
  lastActive: Date.now(),
  isAdmin: false,
  notifications: [],
  tonDomains: [],
  profilePublic: true,
  winStreak: 0,
  maxWinStreak: 0,
  rank: 'novice',
});

// ─── Store ─────────────────────────────────────────────────────────────────────
interface StoreState {
  // Navigation
  activeTab: 'bets' | 'create' | 'portfolio' | 'admin' | 'profile';
  setActiveTab: (tab: StoreState['activeTab']) => void;
  selectedBetId: string | null;
  setSelectedBetId: (id: string | null) => void;
  viewingUserId: string | null;
  setViewingUserId: (id: string | null) => void;

  // Data
  bets: Bet[];
  currentUser: User;
  setCurrentUser: (u: User) => void;
  tonWalletAddress: string | null;
  setTonWalletAddress: (addr: string | null) => void;

  // Filters
  filterCategory: BetCategory | 'all';
  setFilterCategory: (c: BetCategory | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Metrics
  financialMetrics: FinancialMetrics;
  updateFinancialMetrics: () => void;

  // Actions
  recordBet: (betId: string, side: 'yes' | 'no', amount: number, txHash: string, expectedPrice: number) => { ok: boolean; error?: string };
  addComment: (betId: string, text: string) => void;
  voteOnBet: (betId: string, choice: 'yes' | 'no', stake: number) => { ok: boolean; error?: string };
  resolveBet: (betId: string, outcome: 'yes' | 'no') => void;
  createBet: (data: Partial<Bet>) => { ok: boolean; betId?: string; error?: string };
  approveBet: (betId: string) => void;
  featureBet: (betId: string, featured: boolean) => void;
  cancelBet: (betId: string) => void;
  linkTonDomain: (domain: string) => { ok: boolean; error?: string };
  unlinkTonDomain: (domain: string) => void;
  // TON domains from wallet NFTs
  loadDomainsFromWallet: (walletAddr: string) => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      activeTab: 'bets',
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectedBetId: null,
      setSelectedBetId: (id) => set({ selectedBetId: id }),
      viewingUserId: null,
      setViewingUserId: (id) => set({ viewingUserId: id }),

      bets: INITIAL_BETS,
      currentUser: makeDefaultUser(),
      setCurrentUser: (u) => set({ currentUser: u }),
      tonWalletAddress: null,
      setTonWalletAddress: (addr) => set({ tonWalletAddress: addr }),

      filterCategory: 'all',
      setFilterCategory: (c) => set({ filterCategory: c }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      financialMetrics: {
        totalVolume: 0, totalFees: 0, totalPayouts: 0,
        activeBetsCount: 0, resolvedBetsCount: 0, platformRevenue: 0,
        avgBetSize: 0, dailyVolume: 0, weeklyVolume: 0,
      },

      updateFinancialMetrics: () => {
        const { bets } = get();
        const active = bets.filter(b => b.status === 'active');
        const resolved = bets.filter(b => b.status === 'resolved');
        const allParticipants = bets.flatMap(b => b.participants);
        const totalVol = allParticipants.reduce((s, p) => s + p.amount, 0);
        const fees = totalVol * PLATFORM_FEE_PCT;
        const now = Date.now();
        const dayAgo = now - 86400000;
        const weekAgo = now - 604800000;
        const daily = allParticipants.filter(p => p.timestamp > dayAgo).reduce((s, p) => s + p.amount, 0);
        const weekly = allParticipants.filter(p => p.timestamp > weekAgo).reduce((s, p) => s + p.amount, 0);
        set({
          financialMetrics: {
            totalVolume: totalVol,
            totalFees: fees,
            totalPayouts: 0,
            activeBetsCount: active.length,
            resolvedBetsCount: resolved.length,
            platformRevenue: fees,
            avgBetSize: allParticipants.length ? totalVol / allParticipants.length : 0,
            dailyVolume: daily,
            weeklyVolume: weekly,
          },
        });
      },

      recordBet: (betId, side, amount, txHash, expectedPrice) => {
        const { bets, currentUser } = get();
        const bet = bets.find(b => b.id === betId);
        if (!bet) return { ok: false, error: 'Ставка не найдена' };
        if (bet.status !== 'active') return { ok: false, error: 'Ставка не активна' };
        if (amount < MIN_BET_TON) return { ok: false, error: `Минимум ${MIN_BET_TON} TON` };

        const curPrice = side === 'yes' ? bet.yesPrice : bet.noPrice;
        const slippage = Math.abs(curPrice - expectedPrice) / expectedPrice;
        if (slippage > bet.maxSlippagePct) return { ok: false, error: 'Слишком большой slippage' };

        const newYesPool = side === 'yes' ? bet.yesPool + amount : bet.yesPool;
        const newNoPool = side === 'no' ? bet.noPool + amount : bet.noPool;
        const prices = calcAmmPrice(newYesPool, newNoPool);
        const shares = calcShares(amount, side === 'yes' ? bet.yesPool : bet.noPool, side === 'yes' ? bet.noPool : bet.yesPool);

        const userBet: UserBet = {
          betId, userId: currentUser.id, walletAddress: currentUser.walletAddress || 'demo',
          username: currentUser.username, side, amount, shares,
          timestamp: Date.now(), avgPrice: curPrice, txHash, confirmed: true,
        };

        const newPricePoint: PricePoint = {
          time: Date.now(), yesPrice: prices.yes, noPrice: prices.no, volume: amount,
        };

        const updatedBet: Bet = {
          ...bet,
          yesPool: newYesPool, noPool: newNoPool,
          totalVolume: bet.totalVolume + amount,
          yesPrice: prices.yes, noPrice: prices.no,
          participants: [...bet.participants, userBet],
          priceHistory: [...bet.priceHistory, newPricePoint],
        };

        set({
          bets: bets.map(b => b.id === betId ? updatedBet : b),
          currentUser: {
            ...currentUser,
            totalWagered: currentUser.totalWagered + amount,
            activeBets: [...currentUser.activeBets, betId],
          },
        });
        get().updateFinancialMetrics();
        return { ok: true };
      },

      addComment: (betId, text) => {
        const { bets, currentUser } = get();
        const comment: Comment = {
          id: `c_${Date.now()}`,
          userId: currentUser.id, username: currentUser.username,
          avatar: currentUser.avatar, text: text.slice(0, 500),
          timestamp: Date.now(), likes: 0,
        };
        set({ bets: bets.map(b => b.id === betId ? { ...b, comments: [...b.comments, comment] } : b) });
      },

      voteOnBet: (betId, choice, stake) => {
        const { bets, currentUser } = get();
        const bet = bets.find(b => b.id === betId);
        if (!bet) return { ok: false, error: 'Не найдено' };
        if (currentUser.votedBets.includes(betId)) return { ok: false, error: 'Уже проголосовал' };
        if (bet.status !== 'voting') return { ok: false, error: 'Голосование не активно' };

        const vote: Vote = {
          id: `v_${Date.now()}`, userId: currentUser.id,
          walletAddress: currentUser.walletAddress || '', choice, stake,
          timestamp: Date.now(), weight: stake,
        };
        set({
          bets: bets.map(b => b.id === betId ? { ...b, votes: [...b.votes, vote] } : b),
          currentUser: { ...currentUser, votedBets: [...currentUser.votedBets, betId] },
        });
        return { ok: true };
      },

      resolveBet: (betId, outcome) => {
        const { bets } = get();
        set({
          bets: bets.map(b => b.id === betId
            ? { ...b, status: 'resolved', outcome, resolveAt: Date.now() }
            : b
          ),
        });
        get().updateFinancialMetrics();
      },

      createBet: (data) => {
        const { bets, currentUser } = get();
        const id = `bet_${Date.now()}`;
        const now = Date.now();
        const newBet: Bet = {
          id,
          title: data.title || 'Новая ставка',
          description: data.description || '',
          category: data.category || 'custom',
          creatorId: currentUser.id,
          creatorUsername: currentUser.username,
          createdAt: now,
          resolveAt: data.resolveAt || now + 7 * 86400000,
          status: 'pending',
          outcome: null,
          yesPool: 0, noPool: 0, totalVolume: 0,
          yesPrice: 0.5, noPrice: 0.5,
          participants: [], votes: [], comments: [],
          priceHistory: [{ time: now, yesPrice: 0.5, noPrice: 0.5, volume: 0 }],
          oracleType: data.oracleType || 'manual',
          oracleSymbol: data.oracleSymbol,
          oracleTarget: data.oracleTarget,
          oracleDirection: data.oracleDirection,
          adminApproved: false,
          featured: false,
          tags: data.tags || [],
          feePercent: PLATFORM_FEE_PCT,
          treasuryWallet: TREASURY_WALLET,
          minBetTon: MIN_BET_TON,
          maxSlippagePct: 0.05,
        };
        set({ bets: [newBet, ...bets] });
        return { ok: true, betId: id };
      },

      approveBet: (betId) => {
        const { bets } = get();
        set({
          bets: bets.map(b => b.id === betId ? { ...b, adminApproved: true, status: 'active' } : b),
        });
      },

      featureBet: (betId, featured) => {
        const { bets } = get();
        set({ bets: bets.map(b => b.id === betId ? { ...b, featured } : b) });
      },

      cancelBet: (betId) => {
        const { bets } = get();
        set({ bets: bets.map(b => b.id === betId ? { ...b, status: 'cancelled' } : b) });
      },

      linkTonDomain: (domain) => {
        const { currentUser } = get();
        const d = domain.trim().toLowerCase();
        if (!d.endsWith('.ton')) return { ok: false, error: 'Домен должен заканчиваться на .ton' };
        if (currentUser.tonDomains.find(x => x.domain === d)) return { ok: false, error: 'Уже привязан' };
        const newDomain: TonDomain = { domain: d, verified: false, linkedAt: Date.now() };
        set({ currentUser: { ...currentUser, tonDomains: [...currentUser.tonDomains, newDomain] } });
        return { ok: true };
      },

      unlinkTonDomain: (domain) => {
        const { currentUser } = get();
        set({ currentUser: { ...currentUser, tonDomains: currentUser.tonDomains.filter(d => d.domain !== domain) } });
      },

      // Real TON DNS NFT lookup
      loadDomainsFromWallet: async (walletAddr: string) => {
        try {
          // Query TON API for NFT items in this wallet that are .ton domains
          const resp = await fetch(`https://tonapi.io/v2/accounts/${walletAddr}/nfts?collection=0:b774d95eb20543f186c06b371ab88ad704f7e256130caf96189368a7d0cb6ccf&limit=20`);
          if (!resp.ok) return;
          const data = await resp.json();
          const { currentUser } = get();
          const domains: TonDomain[] = (data.nft_items || []).map((item: any) => {
            const name = item.metadata?.name || item.dns || '';
            return {
              domain: name.endsWith('.ton') ? name : `${name}.ton`,
              verified: true,
              linkedAt: Date.now(),
            };
          }).filter((d: TonDomain) => d.domain.endsWith('.ton'));

          if (domains.length > 0) {
            set({
              currentUser: {
                ...currentUser,
                tonDomains: domains,
              },
            });
          }
        } catch {
          // silently fail
        }
      },
    }),
    {
      name: 'flashbet-store-v3',
      partialize: (state) => ({
        currentUser: { ...state.currentUser, isAdmin: false },
        bets: state.bets,
        activeTab: state.activeTab,
        filterCategory: state.filterCategory,
        tonWalletAddress: state.tonWalletAddress,
      }),
    }
  )
);

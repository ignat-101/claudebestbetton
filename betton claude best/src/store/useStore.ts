/**
 * FlashBet TON — Secure State Management v2
 * Maximum security + autonomous operation + financial flows
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  calcAmmPrice, calculateShares, computePosResult,
  checkRateLimit, checkBetSizeLimit, generatePosSnapshot,
  SECURITY_CONFIG, type WeightedVote,
} from '../security/proofOfStake';

export type BetCategory = 'crypto' | 'weather' | 'sports' | 'politics' | 'custom' | 'news';
export type BetStatus = 'pending' | 'active' | 'voting' | 'resolved' | 'cancelled';
export type BetOutcome = 'yes' | 'no' | null;
export type VoteChoice = 'yes' | 'no';

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

export interface Vote extends WeightedVote {
  id: string;
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
  treasuryWallet: string;
  posSnapshotHash?: string;
  resolvedOraclePrice?: number;
  minBetTon: number;
  maxSlippagePct: number;
}

export interface TonDomain {
  domain: string; // e.g. "alice.ton"
  verified: boolean;
  linkedAt: number;
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
  /**
   * SECURITY: isAdmin NEVER stored in localStorage.
   * Set only from Telegram initData HMAC (verified backend).
   */
  isAdmin: boolean;
  notifications: AppNotification[];
  walletAddress?: string;
  tonDomains: TonDomain[];
  bio?: string;
  profilePublic: boolean; // public bets visible to everyone
  winStreak: number;
  maxWinStreak: number;
  rank: 'novice' | 'player' | 'expert' | 'legend' | 'whale';
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

export interface FinancialMetrics {
  totalVolume: number;
  totalFees: number;
  totalValidatorRewards: number;
  totalReferralPaid: number;
  totalPayouts: number;
  activeBetsCount: number;
  resolvedBetsCount: number;
  platformRevenue: number; // fees - costs
  avgBetSize: number;
  dailyVolume: number;
  weeklyVolume: number;
  projectedMonthly: number;
}

// ── Treasury ──────────────────────────────────────────
export const TREASURY_WALLET_ADDRESS = 'UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0';

// ── Rank computation ──────────────────────────────────
export function computeRank(rep: number): User['rank'] {
  if (rep >= 1000) return 'whale';
  if (rep >= 500)  return 'legend';
  if (rep >= 200)  return 'expert';
  if (rep >= 50)   return 'player';
  return 'novice';
}

const RANK_META: Record<User['rank'], { label: string; emoji: string; color: string }> = {
  novice:  { label: 'Новичок',  emoji: '🌱', color: 'text-gray-400' },
  player:  { label: 'Игрок',    emoji: '🎯', color: 'text-blue-400' },
  expert:  { label: 'Эксперт',  emoji: '⚡', color: 'text-purple-400' },
  legend:  { label: 'Легенда',  emoji: '🏆', color: 'text-amber-400' },
  whale:   { label: 'Кит',      emoji: '🐳', color: 'text-emerald-400' },
};
export { RANK_META };

// ── Default user ──────────────────────────────────────
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
  referralCode: `FB_${Math.random().toString(36).slice(2,8).toUpperCase()}`,
  referrals: [],
  referralEarnings: 0,
  joinedAt: Date.now(),
  lastActive: Date.now(),
  isAdmin: false,  // ALWAYS false — set from Telegram initData only
  notifications: [],
  tonDomains: [],
  profilePublic: true,
  bio: '',
  winStreak: 0,
  maxWinStreak: 0,
  rank: 'novice',
});

// ── Demo users for leaderboard ────────────────────────
export const DEMO_USERS: Omit<User, 'notifications' | 'isAdmin'>[] = [
  { id: 'u1', telegramId: 1001, username: 'CryptoWolf', firstName: 'Alex', avatar: '🐺', tonBalance: 245.5, totalWagered: 850, totalWon: 620, totalLost: 230, reputation: 780, activeBets: [], resolvedBets: [], votedBets: [], referralCode: 'WOLF01', referrals: [], referralEarnings: 12.5, joinedAt: Date.now()-86400000*30, lastActive: Date.now()-3600000, tonDomains: [{ domain: 'cryptowolf.ton', verified: true, linkedAt: Date.now()-86400000*10 }], profilePublic: true, bio: 'DeFi trader since 2020 🚀', winStreak: 5, maxWinStreak: 8, rank: 'legend' },
  { id: 'u2', telegramId: 1002, username: 'TonWhale', firstName: 'Boris', avatar: '🐳', tonBalance: 1200, totalWagered: 3200, totalWon: 2800, totalLost: 400, reputation: 1200, activeBets: [], resolvedBets: [], votedBets: [], referralCode: 'WHALE01', referrals: [], referralEarnings: 45.2, joinedAt: Date.now()-86400000*60, lastActive: Date.now()-1800000, tonDomains: [{ domain: 'tonwhale.ton', verified: true, linkedAt: Date.now()-86400000*20 }], profilePublic: true, bio: 'TON ecosystem builder', winStreak: 12, maxWinStreak: 12, rank: 'whale' },
  { id: 'u3', telegramId: 1003, username: 'BlockSage', firstName: 'Viktor', avatar: '🧙', tonBalance: 89.3, totalWagered: 420, totalWon: 310, totalLost: 110, reputation: 420, activeBets: [], resolvedBets: [], votedBets: [], referralCode: 'SAGE01', referrals: [], referralEarnings: 8.1, joinedAt: Date.now()-86400000*15, lastActive: Date.now()-7200000, tonDomains: [], profilePublic: true, bio: 'PoS validator & market analyst', winStreak: 3, maxWinStreak: 6, rank: 'expert' },
  { id: 'u4', telegramId: 1004, username: 'LunaTrader', firstName: 'Maria', avatar: '🌙', tonBalance: 156.7, totalWagered: 680, totalWon: 540, totalLost: 140, reputation: 560, activeBets: [], resolvedBets: [], votedBets: [], referralCode: 'LUNA01', referrals: [], referralEarnings: 15.3, joinedAt: Date.now()-86400000*45, lastActive: Date.now()-900000, tonDomains: [{ domain: 'luna.ton', verified: false, linkedAt: Date.now()-86400000*5 }], profilePublic: true, bio: 'Technical analysis enthusiast 📊', winStreak: 7, maxWinStreak: 7, rank: 'legend' },
  { id: 'u5', telegramId: 1005, username: 'DefiKnight', firstName: 'Dmitry', avatar: '⚔️', tonBalance: 34.2, totalWagered: 180, totalWon: 120, totalLost: 60, reputation: 210, activeBets: [], resolvedBets: [], votedBets: [], referralCode: 'KNIGHT01', referrals: [], referralEarnings: 3.7, joinedAt: Date.now()-86400000*7, lastActive: Date.now()-600000, tonDomains: [], profilePublic: true, bio: 'New to prediction markets', winStreak: 2, maxWinStreak: 4, rank: 'expert' },
];

// ── Initial bets ──────────────────────────────────────
const INITIAL_BETS: Bet[] = [
  {
    id: 'real_001', title: 'Bitcoin достигнет $120,000 до конца июля 2025?',
    description: 'Цена BTC на Binance или CoinGecko достигнет отметки $120,000 до 31 июля 2025 года в 23:59 UTC. Результат проверяется через CoinGecko API автоматически.',
    category: 'crypto', creatorId: 'admin', creatorUsername: 'FlashBet',
    createdAt: Date.now()-86400000, resolveAt: new Date('2025-07-31T23:59:00Z').getTime(),
    status: 'active', outcome: null,
    yesPool: 0, noPool: 0, totalVolume: 0, yesPrice: 0.5, noPrice: 0.5,
    participants: [], votes: [], comments: [],
    priceHistory: [{ time: Date.now(), yesPrice: 0.5, noPrice: 0.5, volume: 0 }],
    oracleType: 'price', oracleSymbol: 'bitcoin', oracleTarget: 120000, oracleDirection: 'above',
    adminApproved: true, featured: true, tags: ['BTC', 'Bitcoin', 'Bull Run'],
    feePercent: 5, treasuryWallet: TREASURY_WALLET_ADDRESS,
    minBetTon: SECURITY_CONFIG.MIN_BET_TON, maxSlippagePct: 5,
  },
  {
    id: 'real_002', title: 'Ethereum Pectra — успешный запуск в Q3 2025?',
    description: 'Ethereum Foundation успешно запустит обновление Pectra в основной сети до 30 сентября 2025. Разрешение: PoS голосование валидаторов (мин. 3, кворум 66.7%).',
    category: 'crypto', creatorId: 'admin', creatorUsername: 'FlashBet',
    createdAt: Date.now()-86400000*3, resolveAt: new Date('2025-09-30T23:59:00Z').getTime(),
    status: 'active', outcome: null,
    yesPool: 0, noPool: 0, totalVolume: 0, yesPrice: 0.5, noPrice: 0.5,
    participants: [], votes: [], comments: [],
    priceHistory: [{ time: Date.now(), yesPrice: 0.5, noPrice: 0.5, volume: 0 }],
    oracleType: 'vote', adminApproved: true, featured: true, tags: ['ETH', 'Ethereum', 'Pectra'],
    feePercent: 5, treasuryWallet: TREASURY_WALLET_ADDRESS,
    minBetTon: SECURITY_CONFIG.MIN_BET_TON, maxSlippagePct: 5,
  },
  {
    id: 'real_003', title: 'TON войдет в топ-5 крипто по капитализации до конца 2025?',
    description: 'TON займет место в топ-5 по рыночной капитализации согласно CoinMarketCap до 31 декабря 2025. Оракул: CoinGecko market_cap_rank ≤ 5.',
    category: 'crypto', creatorId: 'admin', creatorUsername: 'FlashBet',
    createdAt: Date.now()-86400000*2, resolveAt: new Date('2025-12-31T23:59:00Z').getTime(),
    status: 'active', outcome: null,
    yesPool: 0, noPool: 0, totalVolume: 0, yesPrice: 0.5, noPrice: 0.5,
    participants: [], votes: [], comments: [],
    priceHistory: [{ time: Date.now(), yesPrice: 0.5, noPrice: 0.5, volume: 0 }],
    oracleType: 'price', oracleSymbol: 'the-open-network', adminApproved: true, featured: true,
    tags: ['TON', 'Telegram', 'Top5'], feePercent: 5, treasuryWallet: TREASURY_WALLET_ADDRESS,
    minBetTon: SECURITY_CONFIG.MIN_BET_TON, maxSlippagePct: 5,
  },
  {
    id: 'real_004', title: 'Trump подпишет биткоин-резервный закон до сентября 2025?',
    description: 'Президент США Дональд Трамп официально подпишет закон о стратегическом биткоин-резерве США до 1 сентября 2025. Разрешение: PoS голосование.',
    category: 'politics', creatorId: 'admin', creatorUsername: 'FlashBet',
    createdAt: Date.now()-86400000*4, resolveAt: new Date('2025-09-01T00:00:00Z').getTime(),
    status: 'active', outcome: null,
    yesPool: 0, noPool: 0, totalVolume: 0, yesPrice: 0.5, noPrice: 0.5,
    participants: [], votes: [], comments: [],
    priceHistory: [{ time: Date.now(), yesPrice: 0.5, noPrice: 0.5, volume: 0 }],
    oracleType: 'vote', adminApproved: true, featured: false,
    tags: ['Политика', 'Bitcoin', 'США'], feePercent: 5, treasuryWallet: TREASURY_WALLET_ADDRESS,
    minBetTon: SECURITY_CONFIG.MIN_BET_TON, maxSlippagePct: 5,
  },
  {
    id: 'real_005', title: 'FIFA Club World Cup 2025 — выиграет европейский клуб?',
    description: 'Клуб из европейской лиги (УЕФА) выиграет FIFA Club World Cup 2025 в США. Разрешение: официальный результат FIFA.',
    category: 'sports', creatorId: 'admin', creatorUsername: 'FlashBet',
    createdAt: Date.now()-86400000, resolveAt: new Date('2025-08-13T22:00:00Z').getTime(),
    status: 'active', outcome: null,
    yesPool: 0, noPool: 0, totalVolume: 0, yesPrice: 0.5, noPrice: 0.5,
    participants: [], votes: [], comments: [],
    priceHistory: [{ time: Date.now(), yesPrice: 0.5, noPrice: 0.5, volume: 0 }],
    oracleType: 'vote', adminApproved: true, featured: false,
    tags: ['Спорт', 'Футбол', 'FIFA'], feePercent: 5, treasuryWallet: TREASURY_WALLET_ADDRESS,
    minBetTon: SECURITY_CONFIG.MIN_BET_TON, maxSlippagePct: 5,
  },
];

// ── Store interface ───────────────────────────────────
interface AppState {
  activeTab: 'bets' | 'create' | 'portfolio' | 'admin' | 'profile' | 'leaderboard';
  setActiveTab: (tab: AppState['activeTab']) => void;
  selectedBetId: string | null;
  setSelectedBetId: (id: string | null) => void;
  viewingUserId: string | null;
  setViewingUserId: (id: string | null) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  bets: Bet[];
  addBet: (bet: Bet) => void;
  updateBet: (id: string, updates: Partial<Bet>) => void;
  recordBet: (betId: string, side: 'yes' | 'no', amount: number, txHash: string, expectedPrice: number) => { ok: boolean; error?: string };
  resolveBet: (betId: string, outcome: 'yes' | 'no', resolvedBy: 'oracle' | 'pos' | 'admin') => { ok: boolean; error?: string };
  approveBet: (betId: string) => void;
  rejectBet: (betId: string) => void;
  voteOnBet: (betId: string, choice: VoteChoice, stake: number) => { ok: boolean; error?: string };
  addComment: (betId: string, text: string) => void;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  cryptoPrices: Record<string, number>;
  setCryptoPrices: (prices: Record<string, number>) => void;
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
  betRateLog: Array<{ walletAddress: string; timestamp: number }>;
  financialMetrics: FinancialMetrics;
  updateFinancialMetrics: () => void;
  linkTonDomain: (domain: string) => { ok: boolean; error?: string };
  unlinkTonDomain: (domain: string) => void;
  demoUsers: typeof DEMO_USERS;
}

// ── Store implementation ──────────────────────────────
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'bets' as const,
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectedBetId: null,
      setSelectedBetId: (id) => set({ selectedBetId: id }),
      viewingUserId: null,
      setViewingUserId: (id) => set({ viewingUserId: id }),
      currentUser: makeDefaultUser(),
      setCurrentUser: (user) => set({ currentUser: user }),
      bets: INITIAL_BETS,
      demoUsers: DEMO_USERS,
      addBet: (bet) => set(s => ({ bets: [bet, ...s.bets] })),
      updateBet: (id, updates) => set(s => ({ bets: s.bets.map(b => b.id === id ? { ...b, ...updates } : b) })),

      // ── SECURE recordBet ──
      recordBet: (betId, side, amount, txHash, expectedPrice) => {
        const { bets, currentUser, tonWalletAddress, betRateLog } = get();
        const bet = bets.find(b => b.id === betId);
        if (!bet) return { ok: false, error: 'Ставка не найдена' };
        if (bet.status !== 'active') return { ok: false, error: 'Ставка не активна' };
        if (amount < bet.minBetTon) return { ok: false, error: `Минимальная ставка: ${bet.minBetTon} TON` };

        // txHash format
        if (!/^[0-9a-fA-F]{64}$/.test(txHash)) return { ok: false, error: 'Неверный формат txHash' };

        // Rate limit
        if (tonWalletAddress) {
          const rl = checkRateLimit(tonWalletAddress, betRateLog);
          if (!rl.allowed) return { ok: false, error: `Rate limit: ${SECURITY_CONFIG.MAX_BETS_PER_DAY} ставок/24ч` };
        }

        // Bet size
        const sizeCheck = checkBetSizeLimit(amount, bet.yesPool, bet.noPool);
        if (!sizeCheck.allowed) return { ok: false, error: sizeCheck.reason };

        // Slippage
        const currentPrice = side === 'yes' ? bet.yesPrice : bet.noPrice;
        const slippage = Math.abs((currentPrice - expectedPrice) / (expectedPrice || 1)) * 100;
        if (slippage > bet.maxSlippagePct && bet.totalVolume > 0)
          return { ok: false, error: `Slippage ${slippage.toFixed(1)}% > лимит ${bet.maxSlippagePct}%` };

        // Duplicate txHash
        const allTxHashes = bets.flatMap(b => b.participants.map(p => p.txHash));
        if (allTxHashes.includes(txHash)) return { ok: false, error: 'Дубликат txHash' };

        const newYes = side === 'yes' ? bet.yesPool + amount : bet.yesPool;
        const newNo  = side === 'no'  ? bet.noPool + amount  : bet.noPool;
        const shares = calculateShares(
          side === 'yes' ? bet.yesPool : bet.noPool,
          side === 'yes' ? bet.noPool  : bet.yesPool,
          amount
        );
        const { yesPrice, noPrice } = calcAmmPrice(newYes, newNo);
        const userBet: UserBet = {
          betId, userId: currentUser.id,
          walletAddress: tonWalletAddress ?? 'unknown',
          username: currentUser.username, side, amount, shares,
          timestamp: Date.now(), avgPrice: side === 'yes' ? yesPrice : noPrice,
          txHash, confirmed: true,
        };
        const tx: Transaction = {
          id: `tx_${Date.now()}_${txHash.slice(0,8)}`, userId: currentUser.id,
          type: 'bet', amount, betId, timestamp: Date.now(),
          description: `Ставка ${side === 'yes' ? 'ДА' : 'НЕТ'} на "${bet.title}"`,
          txHash, onChainConfirmed: true,
        };
        const newRateLog = tonWalletAddress
          ? [...betRateLog, { walletAddress: tonWalletAddress, timestamp: Date.now() }]
          : betRateLog;

        const newRep = currentUser.reputation + 2;
        const newRank = computeRank(newRep);

        set(s => ({
          bets: s.bets.map(b => b.id === betId ? {
            ...b, yesPool: newYes, noPool: newNo,
            totalVolume: b.totalVolume + amount, yesPrice, noPrice,
            participants: [...b.participants, userBet],
            priceHistory: [...b.priceHistory, { time: Date.now(), yesPrice, noPrice, volume: amount }],
          } : b),
          currentUser: {
            ...s.currentUser, totalWagered: s.currentUser.totalWagered + amount,
            activeBets: [...new Set([...s.currentUser.activeBets, betId])],
            reputation: newRep, rank: newRank,
            notifications: [{
              id: `n_${Date.now()}`, type: 'system',
              title: '✅ Ставка принята!',
              message: `${amount} TON на ${side === 'yes' ? 'ДА' : 'НЕТ'} — tx: ${txHash.slice(0,8)}...`,
              timestamp: Date.now(), read: false,
            }, ...s.currentUser.notifications.slice(0,19)],
          },
          transactions: [tx, ...s.transactions],
          betRateLog: newRateLog,
        }));

        setTimeout(() => get().updateFinancialMetrics(), 100);
        return { ok: true };
      },

      // ── SECURE resolveBet ──
      resolveBet: (betId, outcome, resolvedBy) => {
        const { bets, currentUser } = get();
        const bet = bets.find(b => b.id === betId);
        if (!bet) return { ok: false, error: 'Ставка не найдена' };
        if (!currentUser.isAdmin) return { ok: false, error: 'Доступ запрещён: только администратор' };

        if (resolvedBy === 'pos' && bet.oracleType === 'vote') {
          const posResult = computePosResult(bet.votes);
          if (!posResult.quorumReached)
            return { ok: false, error: `PoS кворум не достигнут: ${posResult.validatorCount}/${SECURITY_CONFIG.MIN_VALIDATORS_FOR_RESOLUTION} валидаторов, вес ДА ${posResult.yesWeightPct}%` };
          if (posResult.outcome !== 'inconclusive' && posResult.outcome !== outcome)
            return { ok: false, error: `PoS результат: ${posResult.outcome}, выбрано: ${outcome} — манипуляция заблокирована` };
        }

        const winners = bet.participants.filter(p => p.side === outcome);
        const totalShares = winners.reduce((s,p) => s + p.shares, 0);
        const totalPool = bet.yesPool + bet.noPool;
        const fee = totalPool * SECURITY_CONFIG.PLATFORM_FEE_PCT;
        const validatorReward = totalPool * SECURITY_CONFIG.VALIDATOR_REWARD_PCT;
        const prize = totalPool - fee - validatorReward;
        const myWin = winners.find(w => w.userId === currentUser.id);
        const myReward = myWin && totalShares > 0 ? (myWin.shares / totalShares) * prize : 0;
        const posSnapshotHash = generatePosSnapshot(bet.votes);

        set(s => ({
          bets: s.bets.map(b => b.id === betId ? { ...b, status: 'resolved', outcome, posSnapshotHash } : b),
          currentUser: {
            ...s.currentUser,
            totalWon: s.currentUser.totalWon + myReward,
            winStreak: myReward > 0 ? s.currentUser.winStreak + 1 : 0,
            maxWinStreak: myReward > 0 ? Math.max(s.currentUser.winStreak + 1, s.currentUser.maxWinStreak) : s.currentUser.maxWinStreak,
            resolvedBets: [...s.currentUser.resolvedBets, betId],
            activeBets: s.currentUser.activeBets.filter(id => id !== betId),
            notifications: [{
              id: `n_${Date.now()}`,
              type: myReward > 0 ? 'win' : 'loss',
              title: myReward > 0 ? '🎉 Вы выиграли!' : '😔 Ставка проиграла',
              message: myReward > 0 ? `+${myReward.toFixed(3)} TON — "${bet.title}"` : `"${bet.title}"`,
              timestamp: Date.now(), read: false,
            }, ...s.currentUser.notifications.slice(0,19)],
          },
        }));
        setTimeout(() => get().updateFinancialMetrics(), 100);
        return { ok: true };
      },

      approveBet: (betId) => {
        if (!get().currentUser.isAdmin) return;
        set(s => ({ bets: s.bets.map(b => b.id === betId ? { ...b, adminApproved: true, status: 'active' } : b) }));
      },
      rejectBet: (betId) => {
        if (!get().currentUser.isAdmin) return;
        set(s => ({ bets: s.bets.map(b => b.id === betId ? { ...b, status: 'cancelled' } : b) }));
      },

      // ── SECURE voteOnBet ──
      voteOnBet: (betId, choice, stake) => {
        const { currentUser, bets } = get();
        const bet = bets.find(b => b.id === betId);
        if (!bet) return { ok: false, error: 'Ставка не найдена' };
        if (currentUser.votedBets.includes(betId)) return { ok: false, error: 'Вы уже проголосовали' };
        if (bet.status !== 'active' && bet.status !== 'voting') return { ok: false, error: 'Голосование недоступно' };
        if (stake < SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON) return { ok: false, error: `Минимальный stake: ${SECURITY_CONFIG.MIN_VALIDATOR_STAKE_TON} TON` };

        const recentVote = bets.flatMap(b => b.votes).find(v => v.userId === currentUser.id);
        if (recentVote && Date.now() - recentVote.timestamp < SECURITY_CONFIG.VOTE_COOLDOWN_MS)
          return { ok: false, error: 'Cooldown 24ч между голосованиями' };

        const vote: Vote = {
          id: `v_${Date.now()}`, userId: currentUser.id, username: currentUser.username,
          choice, stake, reputation: currentUser.reputation,
          timestamp: Date.now(), stakeAge: 0, confidence: 80,
        };

        set(s => ({
          bets: s.bets.map(b => b.id === betId ? { ...b, votes: [...b.votes, vote] } : b),
          currentUser: {
            ...s.currentUser,
            votedBets: [...s.currentUser.votedBets, betId],
            reputation: s.currentUser.reputation + 5,
            rank: computeRank(s.currentUser.reputation + 5),
          },
        }));
        return { ok: true };
      },

      addComment: (betId, text) => {
        const { currentUser } = get();
        const sanitized = text.replace(/<[^>]*>/g, '').slice(0, 500);
        if (!sanitized.trim()) return;
        const comment: Comment = {
          id: `c_${Date.now()}`, userId: currentUser.id, username: currentUser.username,
          avatar: currentUser.avatar, text: sanitized, timestamp: Date.now(), likes: 0,
        };
        set(s => ({ bets: s.bets.map(b => b.id === betId ? { ...b, comments: [...b.comments, comment] } : b) }));
      },

      transactions: [],
      addTransaction: (tx) => set(s => ({ transactions: [tx, ...s.transactions] })),
      cryptoPrices: {},
      setCryptoPrices: (prices) => set({ cryptoPrices: prices }),
      filterCategory: 'all',
      setFilterCategory: (cat) => set({ filterCategory: cat }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      tonWalletAddress: null,
      setTonWalletAddress: (addr) => {
        set({ tonWalletAddress: addr });
        set(s => ({ currentUser: { ...s.currentUser, walletAddress: addr ?? undefined } }));
      },
      pendingTxBetId: null,
      pendingTxSide: null,
      pendingTxAmount: 0,
      setPendingTx: (betId, side, amount) => set({ pendingTxBetId: betId, pendingTxSide: side, pendingTxAmount: amount }),
      betRateLog: [],

      financialMetrics: {
        totalVolume: 0, totalFees: 0, totalValidatorRewards: 0,
        totalReferralPaid: 0, totalPayouts: 0, activeBetsCount: 0,
        resolvedBetsCount: 0, platformRevenue: 0, avgBetSize: 0,
        dailyVolume: 0, weeklyVolume: 0, projectedMonthly: 0,
      },

      updateFinancialMetrics: () => {
        const { bets, transactions } = get();
        const totalVolume = bets.reduce((s,b) => s+b.totalVolume, 0);
        const totalFees = totalVolume * SECURITY_CONFIG.PLATFORM_FEE_PCT;
        const totalValidatorRewards = totalVolume * SECURITY_CONFIG.VALIDATOR_REWARD_PCT;
        const totalReferralPaid = totalVolume * SECURITY_CONFIG.REFERRAL_PCT;
        const totalPayouts = transactions.filter(t => t.type === 'win').reduce((s,t) => s+t.amount, 0);
        const activeBetsCount = bets.filter(b => b.status === 'active').length;
        const resolvedBetsCount = bets.filter(b => b.status === 'resolved').length;
        const platformRevenue = totalFees - totalValidatorRewards - totalReferralPaid;
        const allBetTxs = transactions.filter(t => t.type === 'bet');
        const avgBetSize = allBetTxs.length > 0 ? totalVolume / allBetTxs.length : 0;
        const dayAgo = Date.now() - 86400000;
        const weekAgo = Date.now() - 86400000*7;
        const dailyVolume = allBetTxs.filter(t => t.timestamp > dayAgo).reduce((s,t) => s+t.amount, 0);
        const weeklyVolume = allBetTxs.filter(t => t.timestamp > weekAgo).reduce((s,t) => s+t.amount, 0);
        const projectedMonthly = dailyVolume * 30;
        set({ financialMetrics: {
          totalVolume, totalFees, totalValidatorRewards, totalReferralPaid,
          totalPayouts, activeBetsCount, resolvedBetsCount, platformRevenue,
          avgBetSize, dailyVolume, weeklyVolume, projectedMonthly,
        }});
      },

      linkTonDomain: (domain) => {
        const trimmed = domain.trim().toLowerCase();
        if (!trimmed.endsWith('.ton')) return { ok: false, error: 'Домен должен заканчиваться на .ton' };
        if (trimmed.length < 5) return { ok: false, error: 'Слишком короткий домен' };
        const { currentUser } = get();
        if (currentUser.tonDomains.some(d => d.domain === trimmed))
          return { ok: false, error: 'Домен уже привязан' };
        set(s => ({
          currentUser: {
            ...s.currentUser,
            tonDomains: [...s.currentUser.tonDomains, { domain: trimmed, verified: false, linkedAt: Date.now() }],
          },
        }));
        return { ok: true };
      },
      unlinkTonDomain: (domain) => {
        set(s => ({ currentUser: { ...s.currentUser, tonDomains: s.currentUser.tonDomains.filter(d => d.domain !== domain) } }));
      },
    }),
    {
      name: 'flashbet-v2',
      partialize: (state) => ({
        currentUser: { ...state.currentUser, isAdmin: false },
        bets: state.bets,
        transactions: state.transactions,
        tonWalletAddress: state.tonWalletAddress,
        betRateLog: state.betRateLog,
      }),
      onRehydrateStorage: () => (state) => {
        // SECURITY: always reset isAdmin on load
        if (state?.currentUser) state.currentUser.isAdmin = false;
      },
    }
  )
);

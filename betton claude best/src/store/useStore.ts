import { create } from 'zustand';
import { computePosResult, type WeightedVote } from '../security/proofOfStake';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type BetCategory = 'crypto' | 'sports' | 'politics' | 'news' | 'custom';
export type BetStatus = 'active' | 'voting' | 'resolved' | 'cancelled';
export type OracleType = 'vote' | 'price';
export type Tab = 'bets' | 'create' | 'portfolio' | 'vote' | 'profile';

export interface PricePoint {
  time: number;
  yesPrice: number;
  noPrice: number;
}

export interface OrderbookEntry {
  price: number;
  size: number;
  side: 'yes' | 'no';
}

export interface Participant {
  userId: string;
  username: string;
  side: 'yes' | 'no';
  amount: number;
  txHash: string;
  time: number;
  expectedPrice: number;
  filledPrice?: number;
  pnl?: number;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  time: number;
  likes: number;
}

export interface PosVote {
  userId: string;
  username: string;
  walletAddress: string;
  choice: 'yes' | 'no';
  stake: number;
  reputation: number;
  timestamp: number;
  txHash: string;
  stakeAge: number;
  confidence: number;
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
  oracleType: OracleType;
  oracleSymbol?: string;
  oracleTarget?: number;
  oracleDirection?: 'above' | 'below';
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  yesVolume: number;
  noVolume: number;
  participants: Participant[];
  comments: Comment[];
  priceHistory: PricePoint[];
  posVotes: PosVote[];
  tags: string[];
  featured: boolean;
  resolved?: boolean;
  resolvedOutcome?: 'yes' | 'no';
  yesOrders: OrderbookEntry[];
  noOrders: OrderbookEntry[];
}

export interface User {
  id: string;
  walletAddress: string;
  username: string;
  joinedAt: number;
  reputation: number;
  stakedAmount: number;
  stakeAge: number;
  totalBets: number;
  wins: number;
  losses: number;
  totalVolume: number;
  pnl: number;
  referralCode: string;
  referredBy?: string;
  isAdmin?: boolean;
  avatarEmoji: string;
  badges: string[];
  posVotingPower: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function walletToUsername(addr: string): string {
  return addr.slice(0, 4).toUpperCase() + '…' + addr.slice(-4).toUpperCase();
}

function updateAmmPrice(
  yesVol: number, noVol: number, side: 'yes' | 'no', amount: number
): { yesPrice: number; noPrice: number; yesVol: number; noVol: number } {
  const newYesVol = yesVol + (side === 'yes' ? amount : 0);
  const newNoVol  = noVol  + (side === 'no'  ? amount : 0);
  const total = newYesVol + newNoVol;
  if (total === 0) return { yesPrice: 0.5, noPrice: 0.5, yesVol: newYesVol, noVol: newNoVol };
  const yesPrice = Math.min(0.97, Math.max(0.03, newYesVol / total));
  const noPrice  = 1 - yesPrice;
  return { yesPrice, noPrice, yesVol: newYesVol, noVol: newNoVol };
}

function buildOrderbook(yesPrice: number, liquidity: number): { yesOrders: OrderbookEntry[]; noOrders: OrderbookEntry[] } {
  const yesOrders: OrderbookEntry[] = [];
  const noOrders: OrderbookEntry[] = [];
  const spread = 0.01;
  for (let i = 0; i < 5; i++) {
    const priceStep = i * 0.02;
    const size = Math.max(0.1, liquidity * (0.1 + Math.random() * 0.08) * (1 - i * 0.12));
    yesOrders.push({ price: Math.min(0.97, yesPrice + spread + priceStep), size: +size.toFixed(2), side: 'yes' });
    noOrders.push({ price: Math.min(0.97, (1 - yesPrice) + spread + priceStep), size: +size.toFixed(2), side: 'no' });
  }
  return { yesOrders, noOrders };
}

function generatePriceHistory(currentYes: number, points = 24): PricePoint[] {
  const now = Date.now();
  const history: PricePoint[] = [];
  let price = 0.5 + (Math.random() - 0.5) * 0.3;
  for (let i = points; i >= 0; i--) {
    price += (Math.random() - 0.5) * 0.06;
    price = Math.min(0.95, Math.max(0.05, price));
    history.push({ time: now - i * 3600000, yesPrice: price, noPrice: 1 - price });
  }
  history[history.length - 1] = { time: now, yesPrice: currentYes, noPrice: 1 - currentYes };
  return history;
}

function makeEmptyBets(): Bet[] {
  const templates = [
    {
      title: 'Bitcoin выше $120,000 до конца 2025?',
      description: 'Достигнет ли цена BTC отметки $120k до 31 декабря 2025 года согласно данным Binance?',
      category: 'crypto' as BetCategory,
      oracleType: 'price' as OracleType,
      oracleSymbol: 'BTC',
      oracleTarget: 120000,
      oracleDirection: 'above' as const,
      featured: true,
      tags: ['bitcoin', 'btc', 'crypto'],
      yesBias: 0.62,
    },
    {
      title: 'ETH достигнет $5,000 в 2025?',
      description: 'Ethereum преодолеет ли отметку $5,000 до конца 2025 года?',
      category: 'crypto' as BetCategory,
      oracleType: 'price' as OracleType,
      oracleSymbol: 'ETH',
      oracleTarget: 5000,
      oracleDirection: 'above' as const,
      featured: false,
      tags: ['ethereum', 'eth'],
      yesBias: 0.45,
    },
    {
      title: 'TON войдёт в топ-5 по капитализации?',
      description: 'Займёт ли TON место в топ-5 криптовалют по рыночной капитализации в 2025?',
      category: 'crypto' as BetCategory,
      oracleType: 'vote' as OracleType,
      featured: true,
      tags: ['ton', 'telegram'],
      yesBias: 0.71,
    },
    {
      title: 'Реал Мадрид выиграет Лигу Чемпионов 25/26?',
      description: 'Победит ли Real Madrid в UEFA Champions League в сезоне 2025/26?',
      category: 'sports' as BetCategory,
      oracleType: 'vote' as OracleType,
      featured: false,
      tags: ['football', 'ucl', 'realmadrid'],
      yesBias: 0.38,
    },
    {
      title: 'США примут закон о регулировании DeFi в 2025?',
      description: 'Примет ли Конгресс США специальный закон о DeFi до конца 2025?',
      category: 'politics' as BetCategory,
      oracleType: 'vote' as OracleType,
      featured: false,
      tags: ['defi', 'usa', 'regulation'],
      yesBias: 0.28,
    },
  ];

  const now = Date.now();
  return templates.map((t, i) => {
    const yp = t.yesBias;
    const { yesOrders, noOrders } = buildOrderbook(yp, 0);
    return {
      id: `seed-${i}`,
      title: t.title,
      description: t.description,
      category: t.category,
      creatorId: 'system',
      creatorUsername: 'betton',
      createdAt: now - (5 - i) * 86400000,
      resolveAt: now + (30 + i * 10) * 86400000,
      status: 'active' as BetStatus,
      oracleType: t.oracleType,
      oracleSymbol: (t as {oracleSymbol?: string}).oracleSymbol,
      oracleTarget: (t as {oracleTarget?: number}).oracleTarget,
      oracleDirection: (t as {oracleDirection?: 'above' | 'below'}).oracleDirection,
      yesPrice: yp,
      noPrice: 1 - yp,
      totalVolume: 0,
      yesVolume: 0,
      noVolume: 0,
      participants: [],
      comments: [],
      priceHistory: generatePriceHistory(yp),
      posVotes: [],
      tags: t.tags,
      featured: t.featured,
      yesOrders,
      noOrders,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

interface StoreState {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  selectedBetId: string | null;
  setSelectedBetId: (id: string | null) => void;
  viewingUserId: string | null;
  setViewingUserId: (id: string | null) => void;

  tonWalletAddress: string | null;
  setTonWalletAddress: (addr: string | null) => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;

  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;

  bets: Bet[];
  users: User[];

  filterCategory: BetCategory | 'all';
  setFilterCategory: (c: BetCategory | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  createBet: (params: {
    title: string; description: string; category: BetCategory;
    resolveAt: number; oracleType: OracleType; oracleSymbol?: string;
    oracleTarget?: number; oracleDirection?: 'above' | 'below'; tags: string[];
  }) => { ok: boolean; error?: string };

  placeBet: (betId: string, side: 'yes' | 'no', amount: number, txHash: string) => { ok: boolean; error?: string; filledPrice?: number };

  addPosVote: (betId: string, choice: 'yes' | 'no', stake: number, confidence: number) => { ok: boolean; error?: string };

  addComment: (betId: string, text: string) => void;

  updateFinancialMetrics: () => void;
}

const LS_KEY = 'betton_v4';
function loadState(): Partial<{ bets: Bet[]; users: User[]; tonWalletAddress: string | null; currentUser: User | null; isAdmin: boolean }> {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}
function saveToLS(data: { bets: Bet[]; users: User[]; tonWalletAddress: string | null; currentUser: User | null; isAdmin: boolean }) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

const saved = loadState();

export const useStore = create<StoreState>((set, get) => ({
  activeTab: 'bets',
  setActiveTab: (tab) => set({ activeTab: tab, selectedBetId: null }),
  selectedBetId: null,
  setSelectedBetId: (id) => set({ selectedBetId: id }),
  viewingUserId: null,
  setViewingUserId: (id) => set({ viewingUserId: id }),

  tonWalletAddress: saved.tonWalletAddress ?? null,
  setTonWalletAddress: (addr) => {
    const state = get();
    if (!addr) {
      const next = { ...state, tonWalletAddress: null, currentUser: null };
      set({ tonWalletAddress: null, currentUser: null });
      saveToLS({ bets: next.bets, users: next.users, tonWalletAddress: null, currentUser: null, isAdmin: next.isAdmin });
      return;
    }
    let user = state.users.find(u => u.walletAddress === addr) ?? null;
    if (!user) {
      user = {
        id: generateId(), walletAddress: addr, username: walletToUsername(addr),
        joinedAt: Date.now(), reputation: 100, stakedAmount: 0, stakeAge: 0,
        totalBets: 0, wins: 0, losses: 0, totalVolume: 0, pnl: 0,
        referralCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
        avatarEmoji: ['🦊','🐺','🦁','🐯','🦋','🐲','🦄','🐸'][Math.floor(Math.random()*8)],
        badges: ['🔰'], posVotingPower: 0, isAdmin: false,
      };
      const newUsers = [...state.users, user];
      set({ tonWalletAddress: addr, currentUser: user, users: newUsers });
      saveToLS({ bets: state.bets, users: newUsers, tonWalletAddress: addr, currentUser: user, isAdmin: state.isAdmin });
    } else {
      set({ tonWalletAddress: addr, currentUser: user });
      saveToLS({ bets: state.bets, users: state.users, tonWalletAddress: addr, currentUser: user, isAdmin: state.isAdmin });
    }
  },
  currentUser: saved.currentUser ?? null,
  setCurrentUser: (u) => {
    set({ currentUser: u });
    const s = get();
    saveToLS({ bets: s.bets, users: s.users, tonWalletAddress: s.tonWalletAddress, currentUser: u, isAdmin: s.isAdmin });
  },

  isAdmin: saved.isAdmin ?? false,
  setIsAdmin: (v) => {
    set({ isAdmin: v });
    const s = get();
    saveToLS({ bets: s.bets, users: s.users, tonWalletAddress: s.tonWalletAddress, currentUser: s.currentUser, isAdmin: v });
  },

  bets: saved.bets ?? makeEmptyBets(),
  users: saved.users ?? [],
  filterCategory: 'all',
  setFilterCategory: (c) => set({ filterCategory: c }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // ─── CREATE BET ────────────────────────────────────────────────────────────
  createBet: (params) => {
    const { currentUser, bets } = get();
    if (!currentUser) return { ok: false, error: 'Подключите TON кошелёк' };
    if (!params.title.trim() || params.title.length < 5) return { ok: false, error: 'Введите название (мин. 5 символов)' };
    if (!params.resolveAt || params.resolveAt <= Date.now()) return { ok: false, error: 'Выберите корректную дату' };
    if (params.oracleType === 'price' && !params.oracleSymbol) return { ok: false, error: 'Укажите торговый символ' };

    const yp = 0.5;
    const { yesOrders, noOrders } = buildOrderbook(yp, 0);
    const newBet: Bet = {
      id: generateId(),
      title: params.title.trim(),
      description: params.description.trim(),
      category: params.category,
      creatorId: currentUser.id,
      creatorUsername: currentUser.username,
      createdAt: Date.now(),
      resolveAt: params.resolveAt,
      status: 'active',
      oracleType: params.oracleType,
      oracleSymbol: params.oracleSymbol,
      oracleTarget: params.oracleTarget,
      oracleDirection: params.oracleDirection,
      yesPrice: yp, noPrice: 1 - yp,
      totalVolume: 0, yesVolume: 0, noVolume: 0,
      participants: [], comments: [],
      priceHistory: [{ time: Date.now(), yesPrice: yp, noPrice: 1 - yp }],
      posVotes: [], tags: params.tags, featured: false,
      yesOrders, noOrders,
    };
    const newBets = [newBet, ...bets];
    set({ bets: newBets });
    const s = get();
    saveToLS({ bets: newBets, users: s.users, tonWalletAddress: s.tonWalletAddress, currentUser: s.currentUser, isAdmin: s.isAdmin });
    return { ok: true };
  },

  // ─── PLACE BET (AMM) ───────────────────────────────────────────────────────
  placeBet: (betId, side, amount, txHash) => {
    const { currentUser, bets } = get();
    if (!currentUser) return { ok: false, error: 'Подключите TON кошелёк' };
    if (amount < 0.05) return { ok: false, error: 'Минимальная ставка 0.05 TON' };
    if (amount > 10000) return { ok: false, error: 'Максимальная ставка 10,000 TON' };

    const betIdx = bets.findIndex(b => b.id === betId);
    if (betIdx === -1) return { ok: false, error: 'Событие не найдено' };
    const bet = bets[betIdx];
    if (bet.status !== 'active') return { ok: false, error: 'Ставки закрыты' };

    const before = side === 'yes' ? bet.yesPrice : bet.noPrice;
    const { yesPrice, noPrice, yesVol, noVol } = updateAmmPrice(bet.yesVolume, bet.noVolume, side, amount);

    const participant: Participant = {
      userId: currentUser.id, username: currentUser.username,
      side, amount, txHash, time: Date.now(),
      expectedPrice: before,
      filledPrice: side === 'yes' ? yesPrice : noPrice,
    };

    const newHistory = [...bet.priceHistory, { time: Date.now(), yesPrice, noPrice }];
    const { yesOrders, noOrders } = buildOrderbook(yesPrice, yesVol + noVol);

    const updatedBet: Bet = {
      ...bet, yesPrice, noPrice,
      yesVolume: yesVol, noVolume: noVol,
      totalVolume: bet.totalVolume + amount,
      participants: [...bet.participants, participant],
      priceHistory: newHistory, yesOrders, noOrders,
    };

    const newBets = [...bets];
    newBets[betIdx] = updatedBet;

    const { users } = get();
    const updatedUser: User = { ...currentUser, totalBets: currentUser.totalBets + 1, totalVolume: currentUser.totalVolume + amount };
    const newUsers = users.some(u => u.id === currentUser.id)
      ? users.map(u => u.id === currentUser.id ? updatedUser : u)
      : [...users, updatedUser];

    set({ bets: newBets, users: newUsers, currentUser: updatedUser });
    const s = get();
    saveToLS({ bets: newBets, users: newUsers, tonWalletAddress: s.tonWalletAddress, currentUser: updatedUser, isAdmin: s.isAdmin });
    return { ok: true, filledPrice: participant.filledPrice };
  },

  // ─── PROOF OF STAKE VOTE ───────────────────────────────────────────────────
  addPosVote: (betId, choice, stake, confidence) => {
    const { currentUser, bets } = get();
    if (!currentUser) return { ok: false, error: 'Подключите TON кошелёк' };
    if (stake < 0.1) return { ok: false, error: 'Минимальный стейк 0.1 TON' };

    const betIdx = bets.findIndex(b => b.id === betId);
    if (betIdx === -1) return { ok: false, error: 'Событие не найдено' };
    const bet = bets[betIdx];
    if (bet.status === 'resolved' || bet.status === 'cancelled') return { ok: false, error: 'Голосование завершено' };
    if (bet.posVotes.some(v => v.userId === currentUser.id)) return { ok: false, error: 'Вы уже проголосовали' };

    const txHash = Array.from({ length: 16 }, () => Math.floor(Math.random()*16).toString(16)).join('');
    const vote: PosVote = {
      userId: currentUser.id, username: currentUser.username,
      walletAddress: currentUser.walletAddress,
      choice, stake, reputation: currentUser.reputation,
      timestamp: Date.now(), txHash,
      stakeAge: currentUser.stakeAge, confidence,
    };

    const newVotes = [...bet.posVotes, vote];
    const weightedVotes: WeightedVote[] = newVotes.map(v => ({
      userId: v.userId, username: v.username, choice: v.choice,
      stake: v.stake, reputation: v.reputation, timestamp: v.timestamp,
      txHash: v.txHash, stakeAge: v.stakeAge, confidence: v.confidence,
    }));
    const posResult = computePosResult(weightedVotes);

    let newStatus: BetStatus = bet.status;
    let resolvedOutcome: 'yes' | 'no' | undefined;

    if (posResult.supermajority && posResult.validatorCount >= 3 && posResult.outcome !== 'inconclusive') {
      newStatus = 'resolved';
      resolvedOutcome = posResult.outcome as 'yes' | 'no';
    } else if (newVotes.length >= 2 && bet.status === 'active') {
      newStatus = 'voting';
    }

    let updatedBet: Bet = { ...bet, posVotes: newVotes, status: newStatus };
    if (resolvedOutcome) {
      updatedBet = { ...updatedBet, resolved: true, resolvedOutcome };
    }

    let newBets = [...bets];
    newBets[betIdx] = updatedBet;

    // If resolved — compute PnL
    if (newStatus === 'resolved' && resolvedOutcome) {
      const outcome = resolvedOutcome;
      newBets = newBets.map(b => {
        if (b.id !== betId) return b;
        const winVolume = outcome === 'yes' ? b.yesVolume : b.noVolume;
        const totalPool = b.totalVolume;
        const updatedPart = b.participants.map(p => {
          if (p.side === outcome && winVolume > 0) {
            const payout = (p.amount / winVolume) * totalPool * 0.95;
            return { ...p, pnl: payout - p.amount };
          }
          return { ...p, pnl: -p.amount };
        });
        return { ...b, participants: updatedPart };
      });
    }

    const { users } = get();
    const updatedUser: User = {
      ...currentUser,
      stakedAmount: currentUser.stakedAmount + stake,
      posVotingPower: Math.sqrt(currentUser.stakedAmount + stake) * Math.sqrt(currentUser.reputation),
    };
    const newUsers = users.some(u => u.id === currentUser.id)
      ? users.map(u => u.id === currentUser.id ? updatedUser : u)
      : [...users, updatedUser];

    set({ bets: newBets, users: newUsers, currentUser: updatedUser });
    const s = get();
    saveToLS({ bets: newBets, users: newUsers, tonWalletAddress: s.tonWalletAddress, currentUser: updatedUser, isAdmin: s.isAdmin });
    return { ok: true };
  },

  // ─── ADD COMMENT ───────────────────────────────────────────────────────────
  addComment: (betId, text) => {
    const { currentUser, bets } = get();
    if (!currentUser || !text.trim()) return;
    const betIdx = bets.findIndex(b => b.id === betId);
    if (betIdx === -1) return;
    const comment: Comment = {
      id: generateId(), userId: currentUser.id, username: currentUser.username,
      text: text.trim(), time: Date.now(), likes: 0,
    };
    const newBets = [...bets];
    newBets[betIdx] = { ...bets[betIdx], comments: [...bets[betIdx].comments, comment] };
    set({ bets: newBets });
    const s = get();
    saveToLS({ bets: newBets, users: s.users, tonWalletAddress: s.tonWalletAddress, currentUser: s.currentUser, isAdmin: s.isAdmin });
  },

  // ─── METRICS ───────────────────────────────────────────────────────────────
  updateFinancialMetrics: () => {
    const { bets, users, currentUser } = get();
    if (!currentUser) return;
    const myBets = bets.flatMap(b => b.participants.filter(p => p.userId === currentUser.id));
    const pnl = myBets.reduce((s, p) => s + (p.pnl ?? 0), 0);
    const wins = myBets.filter(p => (p.pnl ?? 0) > 0).length;
    const losses = myBets.filter(p => (p.pnl ?? 0) < 0).length;
    const updatedUser: User = { ...currentUser, pnl, wins, losses, totalBets: myBets.length };
    const newUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    set({ currentUser: updatedUser, users: newUsers });
    const s = get();
    saveToLS({ bets: s.bets, users: newUsers, tonWalletAddress: s.tonWalletAddress, currentUser: updatedUser, isAdmin: s.isAdmin });
  },
}));

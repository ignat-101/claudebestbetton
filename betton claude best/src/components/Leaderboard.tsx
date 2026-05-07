import { useStore, RANK_META, DEMO_USERS, computeRank } from '../store/useStore';

export function Leaderboard() {
  const { currentUser, setViewingUserId, setActiveTab } = useStore();

  // Merge real user into demo users for leaderboard
  const allUsers = [
    ...DEMO_USERS,
    {
      id: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      tonBalance: currentUser.tonBalance,
      totalWagered: currentUser.totalWagered,
      totalWon: currentUser.totalWon,
      reputation: currentUser.reputation,
      winStreak: currentUser.winStreak,
      maxWinStreak: currentUser.maxWinStreak,
      tonDomains: currentUser.tonDomains,
      bio: currentUser.bio,
      profilePublic: currentUser.profilePublic,
      rank: computeRank(currentUser.reputation),
    },
  ].sort((a, b) => b.reputation - a.reputation);

  const openProfile = (userId: string) => {
    setViewingUserId(userId);
    setActiveTab('profile');
  };

  return (
    <div className="flex flex-col h-full bg-mesh">
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <h1 className="text-xl font-black text-white mb-0.5">Лидерборд</h1>
        <p className="text-[11px] text-white/40">Топ игроков по репутации · Нажми для просмотра профиля</p>
      </div>

      <div className="flex-1 overflow-y-auto scroll-content px-4 pb-4 space-y-2">
        {/* Top 3 podium */}
        <div className="flex items-end justify-center gap-3 py-4">
          {[allUsers[1], allUsers[0], allUsers[2]].map((u, i) => {
            const podiumPos = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights = { 1: 'h-24', 2: 'h-16', 3: 'h-12' };
            const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
            if (!u) return null;
            const rank = computeRank(u.reputation);
            const rankMeta = RANK_META[rank];
            const isMe = u.id === currentUser.id;
            return (
              <div key={u.id} className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={() => openProfile(u.id)}>
                <div className={`text-2xl ${isMe ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-transparent rounded-full' : ''}`}>
                  {u.avatar}
                </div>
                <p className="text-[11px] font-bold text-white text-center">@{u.username}</p>
                {u.tonDomains?.[0] && (
                  <span className="ton-domain-badge text-[9px]">💎 {u.tonDomains[0].domain}</span>
                )}
                <p className={`text-[10px] ${rankMeta.color}`}>{rankMeta.emoji} {u.reputation}</p>
                <div className={`${heights[podiumPos as 1|2|3]} w-16 glass-card rounded-t-xl flex items-start justify-center pt-2`}>
                  <span className="text-xl">{medals[podiumPos as 1|2|3]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full list */}
        <div className="space-y-1.5">
          {allUsers.map((u, idx) => {
            const rank = computeRank(u.reputation);
            const rankMeta = RANK_META[rank];
            const isMe = u.id === currentUser.id;
            const roi = u.totalWagered > 0 ? ((u.totalWon - u.totalWagered) / u.totalWagered * 100).toFixed(0) : '0';
            const roiPos = parseFloat(roi) >= 0;
            return (
              <div key={u.id}
                className={`glass-card px-3 py-3 rounded-xl lb-row cursor-pointer transition-all ${isMe ? 'ring-1 ring-purple-400/40' : ''}`}
                onClick={() => openProfile(u.id)}>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-black text-white/30 w-6 text-center">
                    {idx + 1}
                  </span>
                  <div className="text-2xl">{u.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[13px] font-bold ${isMe ? 'text-purple-300' : 'text-white'}`}>
                        @{u.username}
                      </span>
                      {isMe && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">Вы</span>}
                      {u.tonDomains?.[0] && (
                        <span className="ton-domain-badge">💎 {u.tonDomains[0].domain}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] ${rankMeta.color}`}>{rankMeta.emoji} {rankMeta.label}</span>
                      {u.winStreak > 2 && <span className="text-[10px] text-amber-400">🔥 {u.winStreak}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[12px] font-black text-white">{u.reputation} <span className="text-white/30 text-[9px]">rep</span></p>
                    <p className={`text-[10px] font-semibold ${roiPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {roiPos ? '+' : ''}{roi}% ROI
                    </p>
                  </div>
                </div>
                {/* Mini bar */}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-white/30">
                  <span>💎 {u.totalWagered.toFixed(1)} TON</span>
                  <span>·</span>
                  <span className="text-emerald-400/70">🏆 {u.totalWon.toFixed(1)}</span>
                  {u.profilePublic && <span className="ml-auto text-white/20">Профиль открыт →</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

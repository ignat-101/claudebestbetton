import { useBettingStore } from '../store/bettingStore';
import { Search, PlusCircle, Ticket, Wallet } from 'lucide-react';

const tabs = [
  { id: 'discover' as const, label: 'Discover', icon: Search },
  { id: 'create' as const, label: 'Create', icon: PlusCircle },
  { id: 'my-bets' as const, label: 'My Bets', icon: Ticket },
  { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useBettingStore();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 px-2 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-around">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-blue-400 bg-blue-500/10 shadow-inner'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_rgba(96,165,250,0.8)]' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <div className="absolute bottom-2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

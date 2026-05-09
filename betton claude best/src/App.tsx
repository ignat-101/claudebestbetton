import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useBettingStore } from './store/bettingStore';
import { useTonBalance } from './hooks/useTonBalance';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DiscoverTab } from './components/DiscoverTab';
import { CreateTab } from './components/CreateTab';
import { MyBetsTab } from './components/MyBetsTab';
import { WalletTab } from './components/WalletTab';

// TonConnect manifest — use a data URL for single-file builds
const MANIFEST_DATA = {
  url: window.location.origin || 'https://betton.app',
  name: 'Betton',
  iconUrl: 'https://avatars.githubusercontent.com/u/136301506?v=4',
};
const MANIFEST_URL = `data:application/json;base64,${btoa(JSON.stringify(MANIFEST_DATA))}`;


function AppInner() {
  useTonBalance(); // Auto-polls balance every 15s
  const { activeTab } = useBettingStore();

  return (
    <div className="app-bg">
      <Header />

      <main className="content-area">
        <div className="fade-in-up" key={activeTab}>
          {activeTab === 'discover' && <DiscoverTab />}
          {activeTab === 'create' && <CreateTab />}
          {activeTab === 'my-bets' && <MyBetsTab />}
          {activeTab === 'wallet' && <WalletTab />}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <AppInner />
    </TonConnectUIProvider>
  );
}

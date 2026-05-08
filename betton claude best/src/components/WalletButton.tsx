import { useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useStore } from '../store/useStore';

export function WalletButton() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { setTonWalletAddress, currentUser, setCurrentUser, loadDomainsFromWallet } = useStore();

  useEffect(() => {
    if (wallet?.account?.address) {
      const addr = wallet.account.address;
      setTonWalletAddress(addr);
      // Update user wallet
      setCurrentUser({ ...currentUser, walletAddress: addr });
      // Load TON DNS domains from wallet NFTs
      loadDomainsFromWallet(addr);
    } else {
      setTonWalletAddress(null);
    }
  }, [wallet?.account?.address]);

  const addr = wallet?.account?.address;
  const short = addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : null;

  return (
    <button
      className={`wallet-btn ${addr ? 'connected' : ''}`}
      onClick={() => addr ? tonConnectUI.disconnect() : tonConnectUI.openModal()}
    >
      {addr ? (
        <>
          <span style={{ fontSize: 8, color: '#22c55e' }}>●</span>
          {short}
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/>
            <path d="M21 12H13a2 2 0 0 0 0 4h8"/>
          </svg>
          Подключить
        </>
      )}
    </button>
  );
}

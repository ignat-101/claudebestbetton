import { useEffect, useRef } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { useBettingStore } from '../store/bettingStore';

const TONCENTER_API = 'https://toncenter.com/api/v2';

export function useTonBalance() {
  const address = useTonAddress();
  const { setTonBalance, setIsLoadingBalance } = useBettingStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBalance = async (addr: string) => {
    try {
      setIsLoadingBalance(true);
      const res = await fetch(
        `${TONCENTER_API}/getAddressBalance?address=${addr}`
      );
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.ok && data.result !== undefined) {
        const balanceTon = Number(data.result) / 1e9;
        setTonBalance(balanceTon);
      }
    } catch (err) {
      console.warn('Failed to fetch TON balance:', err);
      // Fallback: try getWalletInformation
      try {
        const res2 = await fetch(
          `${TONCENTER_API}/getWalletInformation?address=${addr}`
        );
        const data2 = await res2.json();
        if (data2.ok && data2.result?.balance) {
          const balanceTon = Number(data2.result.balance) / 1e9;
          setTonBalance(balanceTon);
        }
      } catch {
        console.warn('Fallback balance fetch also failed');
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setTonBalance(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    fetchBalance(address);

    // Poll every 15 seconds for real-time balance updates
    intervalRef.current = setInterval(() => fetchBalance(address), 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [address]);

  return { fetchBalance: () => address && fetchBalance(address) };
}

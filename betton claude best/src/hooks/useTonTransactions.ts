import { useTonConnectUI, useTonAddress } from '@tonconnect/ui-react';
import { useBettingStore } from '../store/bettingStore';
import type { Transaction } from '../store/bettingStore';

// Platform wallet address - replace with your actual platform wallet
const PLATFORM_WALLET = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

export function useTonTransactions() {
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const { addTransaction, updateTransaction, setTonBalance, tonBalance } = useBettingStore();

  const sendTon = async (toAddress: string, amountTon: number, comment: string): Promise<string | null> => {
    if (!address) throw new Error('Wallet not connected');

    const amountNano = Math.round(amountTon * 1e9).toString();

    try {
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: toAddress,
            amount: amountNano,
            payload: btoa('\x00\x00\x00\x00' + comment),
          },
        ],
      });

      return result?.boc || null;
    } catch (err: unknown) {
      console.error('Transaction failed:', err);
      throw err;
    }
  };

  const placeBet = async (
    betId: string,
    optionId: string,
    amountTon: number,
    platformAddress: string = PLATFORM_WALLET
  ) => {
    const txId = `tx_${Date.now()}`;
    const comment = `betton:bet:${betId}:${optionId}`;

    const pendingTx: Transaction = {
      id: txId,
      type: 'bet',
      amount: amountTon,
      timestamp: new Date(),
      status: 'pending',
      description: `Bet placed on "${betId}"`,
    };
    addTransaction(pendingTx);

    try {
      const boc = await sendTon(platformAddress, amountTon, comment);
      updateTransaction(txId, { status: 'confirmed', txHash: boc || undefined });
      setTonBalance(Math.max(0, tonBalance - amountTon));
      return boc;
    } catch (err: unknown) {
      updateTransaction(txId, { status: 'failed' });
      throw err;
    }
  };

  const withdraw = async (amountTon: number) => {
    const txId = `tx_withdraw_${Date.now()}`;
    const pendingTx: Transaction = {
      id: txId,
      type: 'withdraw',
      amount: amountTon,
      timestamp: new Date(),
      status: 'pending',
      description: `Withdrawal of ${amountTon} TON`,
    };
    addTransaction(pendingTx);
    
    try {
      // In production: call your backend API to initiate payout from platform wallet
      await new Promise<void>((res) => setTimeout(res, 2000));
      updateTransaction(txId, { status: 'confirmed' });
      setTonBalance(Math.max(0, tonBalance - amountTon));
    } catch {
      updateTransaction(txId, { status: 'failed' });
    }
  };

  return { sendTon, placeBet, withdraw };
}

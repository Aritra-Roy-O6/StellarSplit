import { useState, useCallback } from 'react';
import { requestAccess, signTransaction } from '@stellar/freighter-api';
import * as StellarSdk from 'stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

export function useStellar() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [isConnecting, setIsConnecting] = useState(false);

  const server = new StellarSdk.Horizon.Server(HORIZON_URL);

  // Connect & Fetch Balance
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const result = await requestAccess();
      
      // FIX: Handle different versions of the Freighter API return type
      const pubKey = typeof result === 'string' ? result : result.address;
      
      if (!pubKey) throw new Error("No address returned from Freighter");

      setAddress(pubKey);
      await fetchBalance(pubKey);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect to Freighter. Ensure it is unlocked and set to Testnet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance('0.00');
  };

  const fetchBalance = useCallback(async (pubKey) => {
    try {
      const account = await server.loadAccount(pubKey);
      const nativeBalance = account.balances.find((b) => b.asset_type === 'native');
      if (nativeBalance) {
        setBalance(nativeBalance.balance);
      }
    } catch (error) {
      console.error('Account not found on testnet', error);
      setBalance('0.00 (Unfunded)');
    }
  }, []);

  // Transaction Logic
  const sendTransaction = async (destination, amount) => {
    if (!address) throw new Error('Wallet not connected');

    try {
      const account = await server.loadAccount(address);
      const fee = await server.fetchBaseFee();

      // Ensure amount is formatted to max 7 decimal places for Stellar
      const formattedAmount = Number(amount).toFixed(7).replace(/\.?0+$/, '');

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination,
            asset: StellarSdk.Asset.native(),
            amount: formattedAmount,
          })
        )
        .setTimeout(30)
        .build();

      // Ask Freighter to sign the transaction with explicit network passphrase
      const transactionXdr = transaction.toEnvelope().toXDR('base64');
      const signedResult = await signTransaction(transactionXdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (!signedResult || signedResult.error) {
        throw new Error(signedResult?.error?.message || 'Wallet rejected signing the transaction.');
      }

      const xdrString = signedResult.signedTxXdr || signedResult.signedTransaction;
      if (!xdrString) throw new Error('Failed to retrieve signed XDR from wallet.');

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(xdrString, NETWORK_PASSPHRASE);

      // Submit the signed transaction object to Horizon
      const response = await server.submitTransaction(signedTransaction);

      // Refresh balance after success
      await fetchBalance(address);

      return response.hash;
    } catch (error) {
      console.error('Transaction failed:', error);
      if (error.response) {
        console.error('Horizon response:', error.response.data || error.response.statusText || error.response);
      }

      // Extract meaningful Horizon error messages if available
      if (error.response && error.response.data) {
        const details = error.response.data;
        const txCode = details.extras?.result_codes?.transaction;
        const horizonMsg = details.title || details.detail || details.extras?.result_codes || details.type;
        if (txCode) {
          throw new Error(`Tx Failed: ${txCode}`);
        }
        throw new Error(`Tx Failed: ${details.title || 'Bad Request'} (${error.response.status})`);
      }
      
      throw error;
    }
  };

  return {
    address,
    balance,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sendTransaction,
  };
}
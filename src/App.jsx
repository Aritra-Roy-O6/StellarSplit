import { useState } from 'react';
import { useStellar } from './hooks/useStellar';

function App() {
  const { address, balance, isConnecting, connectWallet, disconnectWallet, sendTransaction } = useStellar();

  const [totalBill, setTotalBill] = useState('');
  const [tipPercentage, setTipPercentage] = useState(0);
  const [people, setPeople] = useState('2');
  const [recipient, setRecipient] = useState('');
  
  const [txState, setTxState] = useState({ status: 'idle', hash: null, error: null });

  // Math Logic
  const billAmount = parseFloat(totalBill) || 0;
  const tipAmount = billAmount * (tipPercentage / 100);
  const grandTotal = billAmount + tipAmount;
  const splitAmount = people > 0 ? (grandTotal / parseInt(people)) : 0;

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!recipient || splitAmount <= 0) return;

    setTxState({ status: 'loading', hash: null, error: null });

    try {
      const hash = await sendTransaction(recipient, splitAmount);
      setTxState({ status: 'success', hash, error: null });
    } catch (err) {
      setTxState({ status: 'error', hash: null, error: err.message || 'Transaction failed or was rejected.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-sans text-slate-200 flex items-center justify-center">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <header className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="text-blue-500">✦</span> StellarSplit
          </h1>
          {address ? (
            <button 
              onClick={disconnectWallet}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition"
            >
              Disconnect
            </button>
          ) : (
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </header>

        <div className="p-6 md:p-8">
          {/* Wallet Info Section */}
          {address ? (
            <div className="mb-8 p-5 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Testnet Balance</p>
                  <p className="text-3xl font-bold text-white">{balance} <span className="text-blue-400 text-xl">XLM</span></p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                 <p className="text-xs text-slate-400 font-medium mb-1">Connected Address</p>
                 <p className="font-mono text-xs text-slate-300 break-all">{address}</p>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-8 text-center text-slate-400 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
              <span className="block text-2xl mb-2">🪐</span>
              Connect your Freighter wallet to start splitting bills.
            </div>
          )}

          {/* Calculator Form */}
          <form onSubmit={handleSettle} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Bill Amount (XLM)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">XLM</span>
                  <input 
                    type="number" 
                    step="0.0000001"
                    min="0"
                    value={totalBill}
                    onChange={(e) => setTotalBill(e.target.value)}
                    className="w-full pl-12 p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Tip: {tipPercentage}%</label>
                <input 
                  type="range" 
                  min="0"
                  max="30"
                  step="5"
                  value={tipPercentage}
                  onChange={(e) => setTipPercentage(e.target.value)}
                  className="w-full h-2 mt-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Split Between</label>
                <input 
                  type="number" 
                  min="2"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Recipient Address</label>
                <input 
                  type="text" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="G..."
                  required
                />
              </div>
            </div>

            {/* Receipt Summary */}
            <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800 text-sm">
               <div className="flex justify-between text-slate-400 mb-2">
                 <span>Subtotal</span>
                 <span>{billAmount.toFixed(2)} XLM</span>
               </div>
               <div className="flex justify-between text-slate-400 mb-3 pb-3 border-b border-slate-800">
                 <span>Tip ({tipPercentage}%)</span>
                 <span>+{tipAmount.toFixed(2)} XLM</span>
               </div>
               <div className="flex justify-between text-white font-medium text-base mb-2">
                 <span>Total</span>
                 <span>{grandTotal.toFixed(2)} XLM</span>
               </div>
               <div className="flex justify-between items-center text-blue-400 font-bold text-lg pt-2 mt-2 border-t border-slate-800 border-dashed">
                 <span>Your Share</span>
                 <span>{splitAmount.toFixed(4)} XLM</span>
               </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={!address || txState.status === 'loading'}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition"
              >
                {txState.status === 'loading' ? 'Confirming on Ledger...' : 'Settle My Share'}
              </button>
            </div>
          </form>

          {/* Transaction Feedback */}
          {txState.status === 'success' && (
            <div className="mt-6 p-4 bg-emerald-950/50 border border-emerald-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-emerald-500 text-xl">✓</span>
                <h3 className="text-emerald-400 font-bold">Payment Settled!</h3>
              </div>
              <p className="text-xs text-emerald-600/80 break-all font-mono mb-3 bg-emerald-950 p-2 rounded">
                {txState.hash}
              </p>
              <a 
                href={`https://stellar.expert/explorer/testnet/tx/${txState.hash}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition inline-flex items-center gap-1"
              >
                Verify on StellarExpert ↗
              </a>
            </div>
          )}

          {txState.status === 'error' && (
            <div className="mt-6 p-4 bg-red-950/50 border border-red-800 rounded-xl">
              <h3 className="text-red-400 font-bold mb-1 flex items-center gap-2">
                <span>⚠</span> Transaction Failed
              </h3>
              <p className="text-sm text-red-400/80">{txState.error}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Note: icons and charting removed for simplified HUD

type Transaction = { id: number; text: string; amount: number; type: 'income' | 'expense' | 'savings'; date: string };

export default function HUD() {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([{ id: 1, text: 'Freelance', amount: 5000, type: 'income', date: new Date().toISOString() }]);
  const idRef = useRef(2);
  const [savings, setSavings] = useState(0);
  const [recurring, setRecurring] = useState([
    { id: 1, text: 'RENT', amount: 14000 },
    { id: 2, text: 'WIFI', amount: 1500 },
    { id: 3, text: 'FOOD', amount: 5000 },
    { id: 4, text: 'LAUNDARY', amount: 2000 }
  ]);

  // Simplified HUD: removed goal visual/editing states
  const [cashInPocket] = useState(2500);

  // Load from Firestore
  useEffect(() => {
    async function fetchData() {
      const docRef = doc(db, "users", "my_user_id");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // normalize transaction dates to ISO strings
        const tx = (data.transactions || []).map((t: unknown) => {
          const tt = t as Partial<Transaction>;
          return { ...(tt as Transaction), date: tt?.date ? new Date(tt.date as string).toISOString() : new Date().toISOString() } as Transaction;
        });
        setTransactions(tx.length ? tx as Transaction[] : []);
        setSavings(data.savings);
        setRecurring(data.recurring);
      }
      setMounted(true);
    }
    fetchData();
  }, []);

  // Save to Firestore
  useEffect(() => {
    if (mounted) {
      const saveData = async () => {
        await setDoc(doc(db, "users", "my_user_id"), { transactions, savings, recurring });
      };
      saveData();
    }
  }, [transactions, savings, recurring, mounted]);

  const totalRecurring = useMemo(() => recurring.reduce((acc, r) => acc + r.amount, 0), [recurring]);

  const totalIncome = useMemo(() => transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0), [transactions]);

  const totalExpenses = useMemo(() => transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0), [transactions]);

  const currentBalance = useMemo(() => {
    return totalIncome - totalExpenses - savings;
  }, [totalIncome, totalExpenses, savings]);

  const safeToSpend = useMemo(() => currentBalance - totalRecurring, [currentBalance, totalRecurring]);

  // Removed chart and savings percent for simplified HUD

  // Simplified survival simulation (burn-rate projection)
  const survivalStats = useMemo(() => {
    let balance = currentBalance + cashInPocket;
    let days = 0;
    const burnRate = (totalRecurring / 30) + 780; // dynamic burn rate

    for (let i = 0; i < 90; i++) {
      balance -= burnRate;
      if (balance <= 0) break;
      days++;
    }

    return { days, burnRate };
  }, [currentBalance, cashInPocket, totalRecurring]);
  const [shiftDays, setShiftDays] = useState(0);

  // Update a single transaction's date (ISO string expected)
  const updateTransactionDate = (id: number, isoDate: string) => {
    setTransactions(prev => prev.map((t: Transaction) => t.id === id ? { ...t, date: isoDate } : t));
  };

  // Shift all transaction dates by given days (positive or negative)
  const shiftAllDatesBy = (days: number) => {
    setTransactions(prev => prev.map((t: Transaction) => {
      const d = new Date(t.date || new Date().toISOString());
      d.setDate(d.getDate() + days);
      return { ...t, date: d.toISOString() };
    }));
  };

  // Handle impulse purchases quickly by adding an expense transaction
  const handleImpulse = (amount: number) => {
    const newExpense: Transaction = { id: idRef.current++, text: 'Impulse', amount: Math.abs(amount), type: 'expense', date: new Date().toISOString() };
    setTransactions(prev => [...prev, newExpense]);
  };

  if (!mounted) return null;

  return (
    <main className="p-6 bg-neutral-50 min-h-screen text-black font-mono">
      {/* 1. SAFETY */}
      <section className="mb-8">
        <h2 className="text-[10px] font-black uppercase mb-4 opacity-50">Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold">SAFE TO SPEND</p>
            <p className="text-3xl font-black">{safeToSpend.toLocaleString()} ETB</p>
          </div>
          <div className="border-4 border-black p-6 bg-black text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-bold text-neutral-400">SURVIVAL</p>
            <p className="text-3xl font-black">{survivalStats.days} DAYS</p>
          </div>
        </div>
      </section>

      {/* 2. DAMAGE */}
      <section className="mb-8 p-6 border-2 border-black bg-white">
        <h2 className="text-[10px] font-black uppercase mb-4">What&apos;s Draining Me</h2>
        <div className="space-y-2">
          {recurring.map(r => (
            <div key={r.id} className="flex justify-between">
              <span className="text-xs font-bold">{r.text}</span>
              <span className="text-xs font-bold">-{r.amount.toLocaleString()} ETB</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. DECISION ENGINE */}
      <section className="p-6 border-4 border-black bg-yellow-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-[10px] font-black uppercase mb-4">Impulse Check</h2>
        <div className="flex gap-4 border-4 border-black p-6 bg-yellow-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {[-100, -500, -1000].map((amt) => (
            <button 
              key={amt} 
              onClick={() => handleImpulse(amt)}
              className="bg-white border-4 border-black px-6 py-2 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              {amt}
            </button>
          ))}
        </div>
      </section>

      {/* HISTORY - per-log date editing + bulk shift */}
      <section className="mt-8 p-6 border-2 border-black bg-white">
        <h2 className="text-[10px] font-black uppercase mb-4">History</h2>

        <div className="flex items-center gap-2 mb-4">
          <input type="number" className="w-24 p-2 border-2 border-black text-xs" value={shiftDays} onChange={(e) => setShiftDays(Number(e.target.value))} />
          <button onClick={() => shiftAllDatesBy(shiftDays)} className="bg-black text-white p-2 border-2 border-black font-bold">Shift All Dates</button>
        </div>

        <div className="space-y-2">
          {transactions.map((t: Transaction) => (
            <div key={t.id} className="flex justify-between items-center border-t-2 pt-2">
              <div>
                <div className="font-bold text-sm">{t.text}</div>
                <div className="text-xs">Amount: {t.amount.toLocaleString()} ETB</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="date" className="p-2 border-2 border-black text-xs" value={t.date ? t.date.slice(0,10) : new Date().toISOString().slice(0,10)} onChange={(e) => updateTransactionDate(t.id, new Date(e.target.value).toISOString())} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
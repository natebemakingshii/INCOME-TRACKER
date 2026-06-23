'use client';
import { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Note: icons and charting removed for simplified HUD

export default function HUD() {
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState([{ id: 1, text: 'Freelance', amount: 5000, type: 'income' }]);
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
        setTransactions(data.transactions);
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
      <section className="p-6 border-4 border-black bg-yellow-400 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-[10px] font-black uppercase mb-4">Impulse Check</h2>
        <div className="flex gap-2">
          {[-100, -500, -1000].map(amt => (
            <button key={amt} className="bg-white border-2 border-black p-2 font-black">
              {amt}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
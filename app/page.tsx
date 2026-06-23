'use client';
import { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Trash2, X, Trash, Pencil, Check } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from 'recharts';

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

  const [goalName, setGoalName] = useState("MACBOOK");
  const [goalAmount, setGoalAmount] = useState(50000);
  const [goalVisual, setGoalVisual] = useState("💻");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoalVisual, setTempGoalVisual] = useState(goalVisual);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ text: '', amount: '', type: 'income' as 'income' | 'expense' | 'savings' });
  const [newRec, setNewRec] = useState({ text: '', amount: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ text: '', amount: '' });
  const [cashInPocket] = useState(2500);
  const [upcomingIncome] = useState([
    { id: 1, amount: 20000, date: new Date('2026-07-02') }
  ]);

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

  const savingsPercent = useMemo(() => Math.min(Math.round((goalAmount === 0 ? 0 : (savings / goalAmount) * 100)), 100), [savings, goalAmount]);

  const chartData = useMemo(() => transactions.slice(-5).map((t, i) => ({
    name: t.text,
    value: transactions.slice(0, i + 1).reduce((acc, curr) =>
      curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0),
  })), [transactions]);

  // Survival simulator (90-day projection)
  const survivalStats = useMemo(() => {
    let balance = currentBalance + cashInPocket;
    let days = 0;
    const maxDays = 90;

    for (let i = 0; i < maxDays; i++) {
      const today = new Date();
      today.setDate(today.getDate() + i);

      // 1. Subtract daily burn (hardcoded conservative value)
      balance -= 780;

      // 2. Subtract recurring on the first of the month
      if (today.getDate() === 1) balance -= totalRecurring;

      // 3. Add upcoming income if it matches today
      const payday = upcomingIncome.find(p => p.date.toDateString() === today.toDateString());
      if (payday) balance += payday.amount;

      if (balance <= 0) break;
      days++;
    }

    const getStatus = (d: number) => {
      if (d > 30) return { label: 'YOU’RE CHILLING', color: 'bg-green-400' };
      if (d > 14) return { label: 'STABLE FOR NOW', color: 'bg-yellow-300' };
      if (d > 7) return { label: 'CAREFUL...', color: 'bg-orange-400' };
      if (d > 3) return { label: 'FINANCIAL WINTER', color: 'bg-red-500' };
      return { label: 'BRO.', color: 'bg-black text-white' };
    };

    const resultDate = new Date();
    resultDate.setDate(resultDate.getDate() + days);
    return { days, status: getStatus(days), date: resultDate };
  }, [currentBalance, cashInPocket, upcomingIncome, totalRecurring]);

  if (!mounted) return null;

  const addTransaction = () => {
    const amount = Number(formData.amount);
    if (!amount) return;
    if (formData.type === 'savings') { setSavings(prev => prev + amount); } 
    else { setTransactions([...transactions, { id: Date.now(), text: formData.text || 'Entry', amount, type: formData.type }]); }
    setIsModalOpen(false);
    setFormData({ text: '', amount: '', type: 'income' });
  };

  return (
    <main className="min-h-screen bg-[#F4F4F4] p-8 font-mono text-black">
      <header className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
          <h1 className="text-sm font-bold">RUNWAY BALANCE</h1>
          <p className="text-6xl font-black mt-2">{currentBalance.toLocaleString()} ETB</p>
        </div>
        <div className="border-4 border-black p-8 bg-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
          <h1 className="text-sm font-bold text-neutral-400">SAFE TO SPEND</h1>
          <p className="text-6xl font-black mt-2">{safeToSpend.toLocaleString()} ETB</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="border-4 border-black p-6 bg-yellow-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl flex flex-col items-center text-center">
            <div className="flex w-full justify-between items-start mb-4">
                <input className="bg-transparent font-bold text-sm uppercase w-full" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
                <button onClick={() => setIsEditingGoal(!isEditingGoal)}>
                    {isEditingGoal ? <Check size={16} /> : <Pencil size={16} />}
                </button>
            </div>
            
            {isEditingGoal ? (
                <div className="flex flex-col gap-2 w-full">
                    <input className="p-2 border-2 border-black text-xs" placeholder="URL or Emoji" value={tempGoalVisual} onChange={(e) => setTempGoalVisual(e.target.value)} onBlur={() => setGoalVisual(tempGoalVisual)} />
                    <input type="number" className="p-2 border-2 border-black text-xs" placeholder="Goal Amount" value={goalAmount} onChange={(e) => setGoalAmount(Number(e.target.value))} />
                </div>
            ) : (
                <div className="my-6 p-4 bg-white border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                    {goalVisual.includes('http') ? <img src={goalVisual} alt="goal" className="w-24 h-24 object-contain" /> : <span className="text-6xl">{goalVisual}</span>}
                </div>
            )}

            <div className="w-full">
                <p className="text-3xl font-black">{savingsPercent}%</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                    {isEditingGoal ? (
                        <input type="number" className="w-20 p-1 border-2 border-black text-xs text-center" defaultValue={savings} onBlur={(e) => setSavings(Number(e.target.value))} />
                    ) : (
                        <p className="text-xs font-bold">{savings.toLocaleString()}</p>
                    )}
                    <p className="text-xs font-bold">/ {goalAmount.toLocaleString()} ETB</p>
                </div>
                <div className="w-full h-4 border-2 border-black bg-white rounded-lg"><div className="h-full bg-black" style={{ width: `${savingsPercent}%` }} /></div>
            </div>
        </div>
        
        <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl flex flex-col">
          <h2 className="font-black text-sm border-b-4 border-black pb-2 mb-4">RECURRING OBLIGATIONS</h2>
          <p className="text-4xl font-black mb-6">-{totalRecurring.toLocaleString()} <span className="text-lg">ETB</span></p>
          <div className="flex-grow space-y-2 mb-4 overflow-y-auto max-h-32">
            {recurring.map(i => (
              <div key={i.id} className="flex justify-between items-center bg-neutral-100 p-2 rounded-lg border-2 border-black">
                <span className="font-bold text-xs truncate mr-2">{i.text}</span>
                <div className="flex gap-2 items-center">
                    <span className="font-black text-sm">-{i.amount}</span>
                    <button onClick={() => setRecurring(recurring.filter(r => r.id !== i.id))}><Trash size={12}/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-auto border-t-2 border-black pt-4">
            <input placeholder="Name" className="w-1/2 p-2 border-2 border-black text-xs" value={newRec.text} onChange={(e) => setNewRec({...newRec, text: e.target.value})} />
            <input placeholder="Amt" type="number" className="w-1/4 p-2 border-2 border-black text-xs" value={newRec.amount} onChange={(e) => setNewRec({...newRec, amount: e.target.value})} />
            <button onClick={() => { if(newRec.text && newRec.amount) { setRecurring([...recurring, {id: Date.now(), text: newRec.text, amount: Number(newRec.amount)}]); setNewRec({text:'', amount:''})}}} className="bg-black text-white px-3 font-bold">+</button>
          </div>
        </div>

        <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
          <h2 className="font-bold mb-4">MOMENTUM</h2>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Line type="monotone" dataKey="value" stroke="#000" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className={`border-4 border-black p-6 ${survivalStats.status.color} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl`}>
          <div className="flex justify-between items-start">
            <h1 className="font-black text-xs uppercase tracking-widest">Survival Meter</h1>
            <span className="font-black text-xs">{survivalStats.status.label}</span>
          </div>

          <p className="text-6xl font-black my-4">{survivalStats.days} DAYS LEFT</p>

          <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4 font-bold text-xs uppercase">
            <div>
              <p className="opacity-70">Until</p>
              <p>{survivalStats.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="opacity-70">Daily Burn</p>
              <p>-780 ETB</p>
            </div>
          </div>

          <div className="mt-6 p-3 bg-white border-2 border-black font-bold text-xs">
            NEXT INCOME SAVES RUN: +20,000 ETB IN 5 DAYS
          </div>
        </div>
      </div>

      <section className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl mb-8">
        <h2 className="text-2xl font-black mb-6">HISTORY</h2>
        {transactions.map(t => (
          <div key={t.id} className="flex justify-between items-center border-2 border-black p-4 mb-2 rounded-xl">
            {editingId === t.id ? (
              <div className="flex gap-2 w-full">
                <input className="border-2 border-black p-1 text-xs w-1/2" defaultValue={t.text} onChange={(e) => setEditData({...editData, text: e.target.value})} />
                <input className="border-2 border-black p-1 text-xs w-1/4" defaultValue={t.amount} onChange={(e) => setEditData({...editData, amount: e.target.value})} />
                <button onClick={() => { setTransactions(transactions.map(tr => tr.id === t.id ? { ...tr, text: editData.text, amount: Number(editData.amount) } : tr)); setEditingId(null); }}><Check size={16}/></button>
              </div>
            ) : (
              <>
                <span className="font-bold">{t.text}</span>
                <div className="flex gap-4 items-center">
                  <span className="font-bold">{t.type === 'income' ? '+' : '-'}{t.amount}</span>
                  <button onClick={() => {setEditingId(t.id); setEditData({text: t.text, amount: t.amount.toString()})}}><Pencil size={16}/></button>
                  <button onClick={() => setTransactions(transactions.filter(x => x.id !== t.id))}><Trash2 size={16}/></button>
                </div>
              </>
            )}
          </div>
        ))}
      </section>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-10 left-10 bg-black text-white p-4 font-black text-xl rounded-full w-14 h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform">N</button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white border-4 border-black p-8 w-96 rounded-2xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between mb-6 font-black"><h2>NEW ENTRY</h2><button onClick={() => setIsModalOpen(false)}><X /></button></div>
            <input className="w-full p-3 border-2 border-black mb-4" placeholder="Desc" onChange={(e) => setFormData({...formData, text: e.target.value})} />
            <input className="w-full p-3 border-2 border-black mb-4" placeholder="Amount" type="number" onChange={(e) => setFormData({...formData, amount: e.target.value})} />
            <select className="w-full p-3 border-2 border-black mb-6" onChange={(e) => setFormData({...formData, type: e.target.value as 'income' | 'expense' | 'savings'})}>
              <option value="income">Income</option><option value="expense">Expense</option><option value="savings">Savings</option>
            </select>
            <button onClick={addTransaction} className="w-full bg-black text-white p-4 font-bold">SAVE</button>
          </div>
        </div>
      )}
    </main>
  );
}
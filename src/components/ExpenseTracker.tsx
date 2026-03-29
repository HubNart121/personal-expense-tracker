'use client';

import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, ArrowUpCircle, ArrowDownCircle, Wallet, Trash2, Download, Filter, BarChart3, ChevronRight, Upload } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  note: string;
  date: string;
  created_at: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ExpenseTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  // Load data from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('expense_tracker_data');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local data', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to LocalStorage whenever transactions change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('expense_tracker_data', JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  // Derived State: Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
    const pattern = `${currentYear}-${monthStr}-`;
    return transactions.filter(tx => tx.date.startsWith(pattern))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentMonth, currentYear]);

  // Derived State: Summary
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(tx => tx.type === 'INCOME')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = filteredTransactions
      .filter(tx => tx.type === 'EXPENSE')
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  // Derived State: Category Analytics
  const categorySummaries = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransactions
      .filter(tx => tx.type === 'EXPENSE')
      .forEach(tx => {
        counts[tx.category] = (counts[tx.category] || 0) + tx.amount;
      });
    return Object.entries(counts)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: formData.get('type') as 'INCOME' | 'EXPENSE',
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as string,
      note: formData.get('note') as string,
      date: formData.get('date') as string,
      created_at: new Date().toISOString()
    };

    setTransactions(prev => [newTx, ...prev]);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this record?')) return;
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          setTransactions(data);
          alert('Data imported successfully!');
        }
      } catch {
        alert('Failed to import data. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) return null;

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header & Main Actions */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Cloud Dashboard</h1>
          <p className="text-muted-foreground mt-1">Personal tracking for {MONTHS[currentMonth - 1]} {currentYear}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-card border border-border rounded-lg p-1">
             <select 
               value={currentMonth}
               onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
               className="bg-transparent text-sm font-medium px-2 py-1 outline-none cursor-pointer"
             >
               {MONTHS.map((m, i) => (
                 <option key={m} value={i + 1} className="bg-card text-foreground">{m}</option>
               ))}
             </select>
             <select 
               value={currentYear}
               onChange={(e) => setCurrentYear(parseInt(e.target.value))}
               className="bg-transparent text-sm font-medium px-2 py-1 outline-none border-l border-border cursor-pointer"
             >
               {[2024, 2025, 2026, 2027].map(y => (
                 <option key={y} value={y} className="bg-card text-foreground">{y}</option>
               ))}
             </select>
          </div>
          
          <label className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent transition-colors border border-border cursor-pointer">
            <Upload size={18} />
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent transition-colors border border-border"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <PlusCircle size={20} />
            <span>{showForm ? 'Close' : 'Add Record'}</span>
          </button>
        </div>
      </header>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={80} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Wallet size={16} className="text-primary" /> Total Balance
            </h3>
            <p className="text-4xl font-bold tracking-tight">฿{summary.balance.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ArrowUpCircle size={80} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <ArrowUpCircle size={16} className="text-green-500" /> Monthly Income
            </h3>
            <p className="text-4xl font-bold tracking-tight text-green-500">+฿{summary.income.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ArrowDownCircle size={80} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <ArrowDownCircle size={16} className="text-destructive" /> Monthly Expense
            </h3>
            <p className="text-4xl font-bold tracking-tight text-destructive">-฿{summary.expense.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Form & History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Add Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-card border border-border p-8 rounded-2xl shadow-md animate-in fade-in slide-in-from-top-4 border-t-4 border-t-primary">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <PlusCircle size={24} className="text-primary" /> Create New Record
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Transaction Type</label>
                  <select name="type" required className="w-full bg-input border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer">
                    <option value="EXPENSE">Expense (จ่าย)</option>
                    <option value="INCOME">Income (รับ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Amount (฿)</label>
                  <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full bg-input border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select name="category" required className="w-full bg-input border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer">
                    <option value="Food & Drinks">🍔 Food & Drinks</option>
                    <option value="Transport">🚗 Transport</option>
                    <option value="Housing">🏠 Housing</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Entertainment">🎬 Entertainment</option>
                    <option value="Utilities">💡 Utilities</option>
                    <option value="Health">💊 Health</option>
                    <option value="Salary">💰 Salary / Income</option>
                    <option value="Other">✨ Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Date</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-input border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">Description (Optional)</label>
                  <input name="note" type="text" placeholder="Detail your spending..." className="w-full bg-input border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-xl font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-primary text-primary-foreground px-10 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Confirm Record
                </button>
              </div>
            </form>
          )}

          {/* History List */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Filter size={20} className="text-primary" /> Transactions History
              </h3>
            </div>
            <div className="divide-y divide-border">
              {filteredTransactions.length === 0 ? (
                <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    <Filter size={32} />
                  </div>
                  <p className="text-lg">No records for this month.</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div key={tx.id} className="group p-4 md:px-8 md:py-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${tx.type === 'INCOME' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                        {tx.type === 'INCOME' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-foreground leading-tight">{tx.category}</p>
                        <p className="text-sm text-muted-foreground">{tx.note || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className={`font-black text-lg ${tx.type === 'INCOME' ? 'text-green-500' : 'text-foreground'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}฿{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={() => handleDelete(tx.id)}
                        className="p-2.5 rounded-xl bg-muted/0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all md:opacity-0 md:group-hover:opacity-100"
                        title="Delete Record"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Statistics */}
        <div className="space-y-8">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm border-t-4 border-t-green-500">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-green-500" /> Spending Analytics
            </h3>
            <div className="space-y-5">
              {categorySummaries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center italic">Register expenses to see breakdown</p>
              ) : (
                categorySummaries.map((cat) => {
                   const percentage = (cat.total / summary.expense) * 100;
                   return (
                    <div key={cat.category} className="space-y-2">
                       <div className="flex justify-between text-sm items-end">
                         <span className="font-bold text-foreground">{cat.category}</span>
                         <span className="font-semibold text-muted-foreground">฿{cat.total.toLocaleString()}</span>
                       </div>
                       <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                         <div 
                           className="bg-primary h-full rounded-full transition-all duration-1000" 
                           style={{ width: `${percentage}%` }}
                         />
                       </div>
                       <p className="text-[10px] text-muted-foreground font-bold tracking-tighter text-right uppercase">
                         {percentage.toFixed(1)}% of total monthly expense
                       </p>
                    </div>
                   );
                })
              )}
            </div>
            
            {categorySummaries.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10">
                   <p className="text-xs font-bold text-green-500/80 uppercase tracking-widest mb-1">Financial Tip</p>
                   <p className="text-sm text-muted-foreground italic leading-relaxed">
                     &quot;Tracking your daily expenses is the first step towards financial freedom.&quot;
                   </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Shortcuts / Info */}
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl">
            <h4 className="font-bold text-primary mb-3 flex items-center gap-2 text-sm uppercase tracking-widest">
              Local Storage Mode
            </h4>
            <ul className="text-xs space-y-3 text-muted-foreground font-medium">
              <li className="flex gap-2">
                <ChevronRight size={14} className="text-primary shrink-0" />
                <span>Your data is stored privately in this browser only.</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight size={14} className="text-primary shrink-0" />
                <span>Use **Export** to backup your data as a JSON file.</span>
              </li>
              <li className="flex gap-2">
                <ChevronRight size={14} className="text-primary shrink-0" />
                <span>Use **Import** to restore your data on another device.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

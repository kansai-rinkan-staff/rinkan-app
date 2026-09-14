import React, { useState } from 'react';
import { AppData, Transaction, CustomBucket } from './actions';
import { Plus, Trash2, Edit2, Download, TrendingUp, TrendingDown, DollarSign, Calculator, AlertCircle, X, ChevronDown, CheckSquare, Check } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: (string | undefined | null | false)[]) { return twMerge(clsx(inputs)); }
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  data: AppData;
  setData: (data: AppData) => void;
  updateData: (newData: AppData) => Promise<void>;
};

export default function AccountingManager({ data, setData, updateData }: Props) {
  const [activeAccount, setActiveAccount] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showSimulator, setShowSimulator] = useState(false);

  // Form State
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formAccount, setFormAccount] = useState<string>(data.accounts?.[0]?.id || '');
  const [formCategory, setFormCategory] = useState<string>(data.transactionCategories?.[0]?.id || '');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);

  const transactions = data.transactions || [];
  const accounts = data.accounts || [];
  const categories = data.transactionCategories || [];
  const budget = data.budgetSettings || {};
  
  // Calculate Totals
  const filteredTx = transactions.filter(t => 
    (activeAccount === 'all' || t.accountId === activeAccount) &&
    (filterType === 'all' || t.type === filterType)
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = filteredTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const openModal = (t?: Transaction) => {
    if (t) {
      setEditingTransaction(t);
      setFormType(t.type);
      setFormDate(t.date);
      setFormAccount(t.accountId);
      setFormCategory(t.categoryId);
      setFormTitle(t.title);
      setFormAmount(t.amount);
    } else {
      setEditingTransaction(null);
      setFormType('expense');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormAccount(activeAccount === 'all' ? accounts[0]?.id || '' : activeAccount);
      setFormCategory(categories[0]?.id || '');
      setFormTitle('');
      setFormAmount(0);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formAccount || !formCategory || !formTitle || formAmount <= 0) {
      alert('すべての項目を正しく入力してください');
      return;
    }

    const newTx: Transaction = {
      id: editingTransaction ? editingTransaction.id : 'tx_' + Date.now(),
      date: formDate,
      type: formType,
      accountId: formAccount,
      categoryId: formCategory,
      title: formTitle,
      amount: formAmount
    };

    let newTxList = [...transactions];
    if (editingTransaction) {
      newTxList = newTxList.map(t => t.id === newTx.id ? newTx : t);
    } else {
      newTxList.push(newTx);
    }

    await updateData({ ...data, transactions: newTxList });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この明細を削除しますか？')) return;
    const newTxList = transactions.filter(t => t.id !== id);
    await updateData({ ...data, transactions: newTxList });
  };

  const handleExport = () => {
    if (filteredTx.length === 0) return;
    const exportData = filteredTx.map(t => ({
      '日付': t.date,
      '収支': t.type === 'income' ? '収入' : '支出',
      '口座': accounts.find(a => a.id === t.accountId)?.name || '-',
      'カテゴリ': categories.find(c => c.id === t.categoryId)?.name || '-',
      '項目名': t.title,
      '金額': t.amount
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "会計明細");
    XLSX.writeFile(wb, `林間_会計データ.xlsx`);
  };

  // Simulator
  const studentsCount = (data.participants || []).filter(p => p.type === 'student').length;
  const youthsCount = (data.participants || []).filter(p => p.type === 'youth').length;
  const totalCount = studentsCount + youthsCount;
  
  const calcTotalFood = (budget.breakfastFee || 0) + (budget.lunchFee || 0) + (budget.dinnerFee || 0);
  const perPersonFixed = (budget.sheetFee || 0) + calcTotalFood;
  const perPersonShared = totalCount > 0 ? ((budget.busFee || 0) + (budget.miscFee || 0)) / totalCount : 0;
  
  const recommendedFee = perPersonFixed + perPersonShared;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <DollarSign className="text-blue-600" size={28}/> 会計・収支管理
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setShowSimulator(!showSimulator)} className={cn("px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors", showSimulator ? "bg-blue-100 text-blue-700" : "bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <Calculator size={18} /> シミュレーター
          </button>
          <button onClick={handleExport} className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 transition-colors">
            <Download size={18} /> Excel出力
          </button>
        </div>
      </div>

      {showSimulator && (
        <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mb-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 border border-blue-100 shadow-inner overflow-hidden">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2"><Calculator size={20}/> 参加費シミュレーター</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 p-4 rounded-2xl">
              <h4 className="font-bold text-sm text-slate-500 mb-3">現在の参加人数</h4>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700">学生部</span>
                <span className="font-black text-lg text-slate-800">{studentsCount}名</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700">青年部・一般</span>
                <span className="font-black text-lg text-slate-800">{youthsCount}名</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">合計</span>
                <span className="font-black text-xl text-blue-700">{totalCount}名</span>
              </div>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl flex flex-col justify-center">
              <h4 className="font-bold text-sm text-slate-500 mb-2">1人あたりの推奨参加費 (目安)</h4>
              <p className="text-xs text-slate-500 mb-4">※設定画面の単価（シーツ代・食費・バス代・雑費）と現在の参加人数から自動計算されています。</p>
              <div className="text-center">
                <span className="text-4xl font-black text-indigo-700">¥{Math.ceil(recommendedFee).toLocaleString()}</span>
                <span className="text-sm font-bold text-indigo-400 ml-1">/人</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Account Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-2">
        <button onClick={() => setActiveAccount('all')} className={cn("px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all", activeAccount === 'all' ? "bg-slate-800 text-white shadow-md" : "bg-white text-slate-500 hover:bg-slate-50")}>
          全体 (すべて)
        </button>
        {accounts.map(acc => (
          <button key={acc.id} onClick={() => setActiveAccount(acc.id)} className={cn("px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all", activeAccount === acc.id ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-500 hover:bg-slate-50")}>
            {acc.name}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-bold text-emerald-600 mb-1 flex items-center gap-1"><TrendingUp size={16}/> 収入合計</span>
          <span className="text-2xl font-black text-slate-800">¥{totalIncome.toLocaleString()}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-bold text-rose-600 mb-1 flex items-center gap-1"><TrendingDown size={16}/> 支出合計</span>
          <span className="text-2xl font-black text-slate-800">¥{totalExpense.toLocaleString()}</span>
        </div>
        <div className={cn("p-6 rounded-3xl border shadow-sm flex flex-col justify-center", balance >= 0 ? "bg-blue-50 border-blue-100" : "bg-rose-50 border-rose-100")}>
          <span className={cn("text-sm font-bold mb-1", balance >= 0 ? "text-blue-700" : "text-rose-700")}>現在の残高</span>
          <span className={cn("text-3xl font-black", balance >= 0 ? "text-blue-900" : "text-rose-900")}>¥{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setFilterType('all')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", filterType === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}>すべて</button>
            <button onClick={() => setFilterType('income')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", filterType === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500")}>収入</button>
            <button onClick={() => setFilterType('expense')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", filterType === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500")}>支出</button>
          </div>
          <button onClick={() => openModal()} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all">
            <Plus size={18} /> 明細を追加
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-slate-400 text-sm border-b-2 border-slate-100">
                <th className="pb-3 pl-4 font-bold">日付</th>
                <th className="pb-3 font-bold">カテゴリ</th>
                <th className="pb-3 font-bold">項目</th>
                <th className="pb-3 font-bold text-right">金額</th>
                <th className="pb-3 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">
                    明細データがありません
                  </td>
                </tr>
              ) : filteredTx.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 group">
                  <td className="py-4 pl-4 text-sm font-bold text-slate-500">{t.date}</td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                      {categories.find(c => c.id === t.categoryId)?.name || '未分類'}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-slate-800">
                    {t.title}
                    {activeAccount === 'all' && (
                      <div className="text-[10px] text-slate-400 mt-0.5">{accounts.find(a => a.id === t.accountId)?.name}</div>
                    )}
                  </td>
                  <td className={cn("py-4 text-right font-black", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                    {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                  </td>
                  <td className="py-4 pr-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg mr-1"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{editingTransaction ? '明細の編集' : '新しい明細を追加'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X size={20}/></button>
              </div>

              <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                <button onClick={() => setFormType('expense')} className={cn("flex-1 py-2 rounded-lg font-bold text-sm transition-all", formType === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>支出</button>
                <button onClick={() => setFormType('income')} className={cn("flex-1 py-2 rounded-lg font-bold text-sm transition-all", formType === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>収入</button>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">日付</label>
                  <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">口座</label>
                    <div className="relative">
                      <select value={formAccount} onChange={e => setFormAccount(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none">
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"/>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリ</label>
                    <div className="relative">
                      <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500 outline-none">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none"/>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">項目名 (摘要)</label>
                  <input type="text" placeholder="例: バスチャーター代" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">金額</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 font-bold text-slate-400">¥</span>
                    <input type="number" min="0" step="1" value={formAmount || ''} onChange={e => setFormAmount(parseInt(e.target.value) || 0)} className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              </div>

              <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                {editingTransaction ? '保存する' : '追加する'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
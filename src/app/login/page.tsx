"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { loginAsViewer, loginAsAdmin } from '../actions';
import { toast } from 'sonner';

export default function LoginPage() {
  const [viewerPwd, setViewerPwd] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPwd, setAdminPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleViewerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await loginAsViewer(viewerPwd);
    if (res.success) {
      window.location.href = '/';
    } else {
      toast.error(res.error);
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await loginAsAdmin(adminId, adminPwd);
    if (res.success) {
      window.location.href = '/';
    } else {
      toast.error(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">スタッフ専用（閲覧）</h2>
          <p className="text-slate-500 mb-8">スケジュールやタスクの確認のみ行う方はこちら</p>
          
          <form onSubmit={handleViewerLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">閲覧用パスワード</label>
              <input 
                type="password" required value={viewerPwd} onChange={e => setViewerPwd(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="パスワードを入力"
              />
            </div>
            <button disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
              閲覧モードで入る
            </button>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">管理者ログイン</h2>
          <p className="text-slate-500 mb-8">予定の編集やタスクの完了操作を行う方はこちら</p>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">管理者ID</label>
              <input 
                type="text" required value={adminId} onChange={e => setAdminId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="IDを入力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
              <input 
                type="password" required value={adminPwd} onChange={e => setAdminPwd(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="パスワードを入力"
              />
            </div>
            <button disabled={loading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors">
              管理者としてログイン
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
}

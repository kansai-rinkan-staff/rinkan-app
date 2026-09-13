"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { checkInviteToken, registerWithToken } from '../actions';
import { toast } from 'sonner';
import { UserPlus, X, Shield, Edit3 } from 'lucide-react';

export default function RegisterPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const params = use(searchParams);
  const token = params.token;

  useEffect(() => {
    if (!token) {
      setChecked(true);
      return;
    }
    checkInviteToken(token).then(r => {
      setRole(r);
      setChecked(true);
    }).catch(() => setChecked(true));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const username = fd.get('username') as string;
    const name = fd.get('name') as string;
    const password = fd.get('password') as string;

    try {
      const res = await registerWithToken(token, username, password, name);
      if (res.success) {
        toast.success('アカウントが作成されました！ログインしてください');
        router.push('/login');
      } else {
        toast.error(res.error || '登録に失敗しました');
      }
    } catch (e) {
      toast.error('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (!checked) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">読み込み中...</div>;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">リンクが無効です</h2>
          <p className="text-sm text-slate-500 mb-6">この招待リンクは無効か、期限が切れています。管理者にもう一度リンクを発行してもらってください。</p>
          <button onClick={() => router.push('/login')} className="bg-slate-100 text-slate-700 font-bold w-full py-3 rounded-xl hover:bg-slate-200 transition-colors">
            ログイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50/50">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center relative">
            <UserPlus size={32} />
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
              {role === 'admin' ? <Shield size={20} className="text-amber-500" /> : <Edit3 size={20} className="text-blue-500" />}
            </div>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-800 tracking-wider">
            {role === 'admin' ? '全体管理者 登録' : '編集者 登録'}
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">関西林間学校アプリ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">お名前 (表示名)</label>
            <input 
              name="name" 
              type="text" 
              required 
              placeholder="例: 山田太郎" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">ログインID (半角英数字)</label>
            <input 
              name="username" 
              type="text" 
              pattern="[a-zA-Z0-9]+"
              title="半角英数字のみ"
              required 
              placeholder="ID" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">パスワード</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="パスワード" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 disabled:bg-blue-400 text-white font-bold rounded-xl py-3.5 mt-2 transition-colors hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center justify-center gap-2"
          >
            {loading ? '登録中...' : 'アカウントを作成してログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* eslint-disable */
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
        toast.success('繧｢繧ｫ繧ｦ繝ｳ繝医′菴懈・縺輔ｌ縺ｾ縺励◆・√Ο繧ｰ繧､繝ｳ縺励※縺上□縺輔＞');
        router.push('/login');
      } else {
        toast.error(res.error || '逋ｻ骭ｲ縺ｫ螟ｱ謨励＠縺ｾ縺励◆');
      }
    } catch (e) {
      toast.error('繧ｨ繝ｩ繝ｼ縺檎匱逕溘＠縺ｾ縺励◆');
    } finally {
      setLoading(false);
    }
  };

  if (!checked) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ...</div>;
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">繝ｪ繝ｳ繧ｯ縺檎┌蜉ｹ縺ｧ縺・/h2>
          <p className="text-sm text-slate-500 mb-6">縺薙・諡帛ｾ・Μ繝ｳ繧ｯ縺ｯ辟｡蜉ｹ縺九∵悄髯舌′蛻・ｌ縺ｦ縺・∪縺吶らｮ｡逅・・↓繧ゅ≧荳蠎ｦ繝ｪ繝ｳ繧ｯ繧堤匱陦後＠縺ｦ繧ゅｉ縺｣縺ｦ縺上□縺輔＞縲・/p>
          <button onClick={() => router.push('/login')} className="bg-slate-100 text-slate-700 font-bold w-full py-3 rounded-xl hover:bg-slate-200 transition-colors">
            繝ｭ繧ｰ繧､繝ｳ逕ｻ髱｢縺ｸ謌ｻ繧・          </button>
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
            {role === 'admin' ? '蜈ｨ菴鍋ｮ｡逅・・逋ｻ骭ｲ' : '邱ｨ髮・・逋ｻ骭ｲ'}
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">髢｢隘ｿ譫鈴俣蟄ｦ譬｡繧｢繝励Μ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">縺雁錐蜑・(陦ｨ遉ｺ蜷・</label>
            <input 
              name="name" 
              type="text" 
              required 
              placeholder="萓・ 螻ｱ逕ｰ螟ｪ驛・ 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">繝ｭ繧ｰ繧､繝ｳID (蜊願ｧ定恭謨ｰ蟄・</label>
            <input 
              name="username" 
              type="text" 
              pattern="[a-zA-Z0-9]+"
              title="蜊願ｧ定恭謨ｰ蟄励・縺ｿ"
              required 
              placeholder="ID" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">繝代せ繝ｯ繝ｼ繝・/label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="繝代せ繝ｯ繝ｼ繝・ 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 disabled:bg-blue-400 text-white font-bold rounded-xl py-3.5 mt-2 transition-colors hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center justify-center gap-2"
          >
            {loading ? '逋ｻ骭ｲ荳ｭ...' : '繧｢繧ｫ繧ｦ繝ｳ繝医ｒ菴懈・縺励※繝ｭ繧ｰ繧､繝ｳ'}
          </button>
        </form>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from 'react';
import { Menu, RotateCw, CloudRain, Home, Edit2, Check, X } from 'lucide-react';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwgnfZN3l9qw8sZ1ti-QEhvC2ag0rmHdorEYdLQlaDENf0oIBWusnuFlT-eENLt_ZGd/exec';

type SheetData = { sheetName: string; csvData: string; colWidths?: number[]; };
type CardData = { id: string; time: string; activity: string; tasks: any[] };

function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let currentRow: string[] = []; let currentVal = ''; let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]; const nextChar = text[i + 1];
    if (char === '"') { if (inQuotes && nextChar === '"') { currentVal += '"'; i++; } else { inQuotes = !inQuotes; } }
    else if (char === ',' && !inQuotes) { currentRow.push(currentVal); currentVal = ''; }
    else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal); rows.push(currentRow); currentRow = []; currentVal = '';
    } else { currentVal += char; }
  }
  if (currentVal !== '' || currentRow.length > 0) { currentRow.push(currentVal); rows.push(currentRow); }
  return rows;
}

export default function App() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [editItem, setEditItem] = useState<CardData | null>(null);

  useEffect(() => {
    const savedPass = localStorage.getItem('rinkan_pass');
    if (savedPass) { setPassword(savedPass); fetchData(savedPass); }
  }, []);

  const fetchData = async (pass: string, force = false) => {
    setLoading(true); setError('');
    try {
      const url = `${GAS_URL}?key=${pass}${force ? '&nocache=' + Date.now() : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('通信エラー');
      const text = await res.text();
      if (text === 'error') { localStorage.removeItem('rinkan_pass'); throw new Error('パスワードエラー'); }
      const data = JSON.parse(text) as SheetData[];
      if (data.length === 0) throw new Error('シートなし');
      
      localStorage.setItem('rinkan_pass', pass);
      setIsAuthenticated(true);
      setSheets(data);
      const annSheet = data.find(s => s.sheetName === 'アナウンス');
      if (annSheet) {
        const rows = parseCSV(annSheet.csvData);
        if (rows[0] && rows[0][0]) setAnnouncement(rows[0][0].trim());
      }
      const itinIndex = data.findIndex(s => s.sheetName === '行程表');
      if (itinIndex >= 0) setCurrentSheetIndex(itinIndex);
    } catch (e: any) { setError(e.message); setIsAuthenticated(false); }
    finally { setLoading(false); }
  };

  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); fetchData(password); };

  const saveEdit = async () => {
    if (!editItem) return;
    setLoading(true);
    try {
      alert(`保存リクエスト送信: ${editItem.time} ${editItem.activity}`);
      setEditItem(null);
    } catch (e) { alert('保存失敗'); }
    finally { setLoading(false); }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-700">曽爾林間 2026</h2>
          {error && <div className="text-red-500 mb-4 text-sm bg-red-50 p-2 rounded">{error}</div>}
          <input type="password" placeholder="パスワード" className="w-full border p-2 rounded mb-4" value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded font-bold" disabled={loading}>{loading ? '読込中...' : 'ログイン'}</button>
        </form>
      </div>
    );
  }

  const currentSheet = sheets[currentSheetIndex];
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="sticky top-0 bg-white shadow-sm z-10 flex items-center justify-between p-3">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600"><Menu /></button>
        <h1 className="font-bold text-blue-700 flex-1 text-center truncate px-2">{currentSheet?.sheetName}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2 rounded ${isEditMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}><Edit2 size={20} /></button>
          <button onClick={() => fetchData(password, true)} className="p-2 text-gray-600"><RotateCw size={20} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </header>
      
      {announcement && (
        <div className="bg-red-50 text-red-700 py-1 overflow-hidden border-b border-red-200">
          <div className="whitespace-nowrap font-bold text-sm marquee inline-block">{announcement}</div>
        </div>
      )}

      <main className="p-3">
         {currentSheet?.sheetName === '行程表' ? (
           <div className="space-y-3">
             <div className="bg-white p-4 rounded shadow">
               <div className="flex justify-between items-start border-b pb-2 mb-2">
                 <div className="font-bold text-lg">08:00 学校集合</div>
                 {isEditMode && (<button onClick={() => setEditItem({id:'1', time:'08:00', activity:'学校集合', tasks:[]})} className="text-blue-600 bg-blue-50 p-1 rounded text-sm">編集</button>)}
               </div>
               <div className="text-sm">出席確認、健康観察</div>
             </div>
             {editItem && (
               <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-lg w-full max-w-md p-4">
                   <h3 className="font-bold text-lg mb-4 flex justify-between">スケジュールの編集<button onClick={() => setEditItem(null)}><X size={20} /></button></h3>
                   <div className="space-y-3">
                     <div><label className="text-xs font-bold text-gray-500">時間</label><input type="text" className="w-full border p-2 rounded" value={editItem.time} onChange={e => setEditItem({...editItem, time: e.target.value})} /></div>
                     <div><label className="text-xs font-bold text-gray-500">内容</label><input type="text" className="w-full border p-2 rounded" value={editItem.activity} onChange={e => setEditItem({...editItem, activity: e.target.value})} /></div>
                     <button onClick={saveEdit} className="w-full bg-blue-600 text-white font-bold py-2 rounded mt-4 flex items-center justify-center gap-2"><Check size={18} /> 保存する</button>
                   </div>
                 </div>
               </div>
             )}
           </div>
         ) : currentSheet?.sheetName === 'タスク管理' ? (
           <div className="space-y-4">
             {['準備（当日まで）', '林間当日', '事後・片付け'].map(phase => (
               <div key={phase} className="bg-white rounded shadow overflow-hidden">
                 <div className="bg-blue-600 text-white font-bold px-4 py-2">{phase}</div>
                 <div className="p-0">
                   {parseCSV(currentSheet.csvData)
                     .filter((row, i) => i > 0 && row[0] === phase)
                     .map((row, i) => (
                       <label key={i} className="flex items-start p-3 border-b hover:bg-gray-50 cursor-pointer">
                         <input type="checkbox" className="mt-1 mr-3 h-5 w-5 rounded border-gray-300" defaultChecked={row[4] === '完了'} />
                         <div className="flex-1">
                           <div className="font-bold text-gray-800">{row[1] || '無名タスク'}</div>
                           <div className="text-xs text-gray-500 flex gap-3 mt-1">
                             {row[2] && <span>期限: {row[2]}</span>}
                             {row[3] && <span>担当: {row[3]}</span>}
                           </div>
                         </div>
                       </label>
                   ))}
                   {parseCSV(currentSheet.csvData).filter((row, i) => i > 0 && row[0] === phase).length === 0 && (
                     <div className="p-4 text-center text-gray-400 text-sm">タスクがありません</div>
                   )}
                 </div>
               </div>
             ))}
           </div>
         ) : (<div className="bg-white p-4 rounded shadow overflow-auto"><pre className="text-xs">{currentSheet?.csvData}</pre></div>)}
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-64 bg-white h-full shadow-lg flex flex-col">
            <div className="p-4 font-bold border-b text-lg">曽爾林間 2026</div>
            <ul className="flex-1 overflow-y-auto">
              {sheets.filter(s => s.sheetName !== 'アナウンス').map((sheet, idx) => (
                <li key={idx} className={`p-3 border-b cursor-pointer ${idx === currentSheetIndex ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-l-blue-700' : ''}`} onClick={() => { setCurrentSheetIndex(idx); setIsSidebarOpen(false); }}>{sheet.sheetName}</li>
              ))}
            </ul>
            <div className="p-4 border-t space-y-3 text-sm font-bold text-blue-700">
              <a href="https://weather.yahoo.co.jp/weather/zoomradar/" target="_blank" className="flex items-center gap-2"><CloudRain size={18} /> 雨雲レーダー</a>
              <a href="https://soni.niye.go.jp/" target="_blank" className="flex items-center gap-2"><Home size={18} /> 曽爾自然の家 公式</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

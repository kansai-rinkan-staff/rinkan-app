
"use client";

import { useState, useEffect, useRef } from 'react';
import { Menu, RotateCw, CloudRain, Home, Edit2, Check, X, Plus, Calendar, CheckSquare, Clock, Settings, Users, Eye, Shield, Edit3, UserPlus, Link2, Copy, Component, Car, LogOut, Type, Trash2, CalendarDays, Link as LinkIcon, FileText, ChevronLeft, ChevronRight, AlignLeft, Download } from 'lucide-react';
import { getAppData, saveAppData, AppData, ScheduleItem, TaskItem, getSessionRole, logout, getUsers, addUser, deleteUser, updateViewerPassword, generateInviteToken, getViewerPassword, User } from './actions';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import RosterManager from './RosterManager';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState<'schedule' | 'tasks' | 'roster' | 'groups' | 'duties' | 'settings'>('schedule');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer' | 'none'>('none');
  const [usersList, setUsersList] = useState<User[]>([]);

  const [fontSize, setFontSize] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dates, setDates] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('すべて');
  const [showRoleFilter, setShowRoleFilter] = useState<boolean>(false);
  const scheduleRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const [taskView, setTaskView] = useState<'list'|'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [activeSetting, setActiveSetting] = useState<'menu'|'font'|'schedule'|'roles'|'tasks'|'accounts'>('menu');

  const [taskModal, setTaskModal] = useState<{isOpen: boolean, task: TaskItem | null}>({isOpen: false, task: null});
  const [scheduleModal, setScheduleModal] = useState<{isOpen: boolean, schedule: ScheduleItem | null}>({isOpen: false, schedule: null});
  
  useEffect(() => {
    fetchData();
    fetchRole();
  }, []);

  const fetchRole = async () => {
    const r = await getSessionRole();
    setRole(r as any);
    if (r === 'admin') {
      getUsers().then(setUsersList).catch(console.error);
    }
    // Prevent unauthorized access to tabs on mount if somehow state was persisted
    if ((r === 'viewer' || r === 'none') && currentTab === 'tasks') setCurrentTab('schedule');
    if (r !== 'admin' && currentTab === 'settings' && activeSetting !== 'menu' && activeSetting !== 'font') { setActiveSetting('menu'); }
  };

  const fetchData = async () => {
    try {
      const res = await getAppData();
      // Auto-migrate "飯盒・キャンプファイヤー" -> "飯・キャ"
      if (res.roles) {
        res.roles = res.roles.map((r: string) => r === '飯盒・キャンプファイヤー' ? '飯・キャ' : r).filter((r: string) => r !== '全員' && r !== '責任者');
      }
      if (res.schedule) {
        res.schedule.forEach((s: any) => {
          if (s.roleNotes) s.roleNotes.forEach((n: any) => { if (n.role === '飯盒・キャンプファイヤー') n.role = '飯・キャ'; });
        });
      }
      if (res.tasks) {
        res.tasks.forEach((t: any) => {
          if (t.fileUrl && !t.fileUrls) t.fileUrls = [t.fileUrl];
          if (!t.fileUrls) t.fileUrls = [];
        });
      }

      setData(res);
      const uniqueDates = Array.from(new Set(res.schedule.map((s: ScheduleItem) => s.time.split(' ')[0]))).sort() as string[];
      setDates(uniqueDates);
      if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0]);
      
      // Auto-scroll logic happens in another effect
    } catch (e) {
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (newData: AppData) => {
    setData(newData);
    setSaving(true);
    try {
      await saveAppData(newData);
      const uniqueDates = Array.from(new Set(newData.schedule.map((s: ScheduleItem) => s.time.split(' ')[0]))).sort() as string[];
      setDates(uniqueDates);
      if (!uniqueDates.includes(selectedDate) && uniqueDates.length > 0) {
        setSelectedDate(uniqueDates[0]);
      }
    } catch (e) {
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // Auto-scroll effect
  useEffect(() => {
    if (currentTab === 'schedule' && data && data!.schedule && data!.schedule.length > 0) {
      const filtered = data!.schedule!.filter((s: ScheduleItem) => s.time.split(' ')[0] === selectedDate);
      if (filtered.length > 0) {
        const now = new Date();
        let closest = filtered[0];
        for (const s of filtered) {
          const sTime = new Date(s.time.replace(' ', 'T'));
          if (sTime >= now) {
            closest = s;
            break;
          }
        }
        setTimeout(() => {
          if (scheduleRefs.current[closest.id]) {
            scheduleRefs.current[closest.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [currentTab, selectedDate, data?.schedule]);

  const exportToExcel = async () => {
    try {
      toast.loading('ダウンロード準備中...', { id: 'excel' });
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(
        (data?.schedule || []).map((s: ScheduleItem) => ({
          '日時': s.time,
          '活動内容': s.activity || '',
          '役割ごとの指示': (s.roleNotes||[]).map((n: any) => `【${n.role}】${n.note}`).join('\n')
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "行程表");
      XLSX.writeFile(wb, "林間学校_行程表.xlsx");
      toast.success('ダウンロードしました', { id: 'excel' });
    } catch (e) {
      console.error(e);
      toast.error('Excel出力に失敗しました', { id: 'excel' });
    }
  };

  if (loading || role === 'none') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>;
  }

  const filteredSchedule = data?.schedule.filter((s: ScheduleItem) => s.time.split(' ')[0] === selectedDate) || [];
  const rolesList = data?.roles || ['学生部', '裏方', '保健', '生活', 'お茶', '飯・キャ'];
  const eventDatesList = data?.eventDates || dates;
  const taskAssigneesList = data?.taskAssignees || ['学生部', '裏方', '保健', '生活', '全体'];
  
  const getRoleColor = (text: string) => {
    if (text.includes('学生部')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (text.includes('裏方')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (text.includes('保健')) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (text.includes('生活')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (text.includes('お茶')) return 'bg-lime-50 text-lime-600 border-lime-100';
    if (text.includes('飯盒') || text.includes('キャンプ') || text.includes('飯・キャ')) return 'bg-orange-50 text-orange-600 border-orange-100';
    return 'bg-slate-50 text-slate-600 border-slate-100';
  };

  const getDaysUntil = () => {
    if (!data?.startDate) return null;
    const now = new Date();
    const target = new Date(data.startDate);
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };
  const daysUntil = getDaysUntil();

  return (
    <div className={cn("min-h-screen bg-slate-50 font-sans pb-24", fontSize)}>
      
      {/* Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex">
            <motion.div initial={{x: '-100%'}} animate={{x: 0}} exit={{x: '-100%'}} transition={{type: 'tween', duration: 0.3}} className="w-64 bg-white h-full shadow-2xl flex flex-col">
              <div className="p-6 bg-blue-600 text-white">
                <h2 className="text-2xl font-bold tracking-wider">関西林間</h2>
              </div>
                            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-2 mb-6">
                  <button onClick={() => {setCurrentTab('schedule'); setSidebarOpen(false);}} className={cn("w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-colors", currentTab === 'schedule' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}>
                    <CalendarDays size={24} /> 行程表
                  </button>
                  {role !== 'viewer'  && (
                    <button onClick={() => {setCurrentTab('tasks'); setSidebarOpen(false);}} className={cn("w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-colors", currentTab === 'tasks' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}>
                      <CheckSquare size={24} /> タスク
                    </button>
                  )}
                  <button onClick={() => {setCurrentTab('roster'); setSidebarOpen(false);}} className={cn("w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-colors", currentTab === 'roster' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}>
                    <Users size={24} /> 参加者名簿
                  </button>
                  <button onClick={() => {setCurrentTab('groups'); setSidebarOpen(false);}} className={cn("w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-colors", currentTab === 'groups' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}>
                    <Component size={24} /> 班・部屋割
                  </button>
                  <button onClick={() => {setCurrentTab('duties'); setSidebarOpen(false);}} className={cn("w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-colors", currentTab === 'duties' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}>
                    <Car size={24} /> 配車・役割分担
                  </button>
                  <button onClick={() => {setCurrentTab('settings'); setActiveSetting('menu'); setSidebarOpen(false);}} className={cn("w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-colors", currentTab === 'settings' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-700")}>
                    <Settings size={24} /> 設定
                  </button>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 mb-3 px-4 uppercase tracking-wider">関連リンク</h3>
                  <div className="space-y-2">
                    <a href="https://soni.niye.go.jp/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors">
                      <Home size={20} className="text-slate-400" />
                      曾爾青少年自然の家
                    </a>
                    <a href="https://tenki.jp/radar/6/30/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition-colors">
                      <CloudRain size={20} className="text-blue-400" />
                      雨雲レーダー
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100">
                <button onClick={() => setSidebarOpen(false)} className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center gap-2 font-bold justify-center transition-colors">
                  <X size={20} /> 閉じる
                </button>
              </div>
            </motion.div>
            <div className="flex-1" onClick={() => setSidebarOpen(false)}></div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-blue-600 text-white p-3 pb-4 pt-[max(env(safe-area-inset-top,0px),12px)] shadow-md rounded-b-3xl sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-white hover:bg-white/20 rounded-xl transition-colors">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-wider">{currentTab === 'schedule' ? '行程表' : currentTab === 'tasks' ? 'タスク' : currentTab === 'roster' ? '参加者名簿' : currentTab === 'groups' ? '班・部屋割' : currentTab === 'duties' ? '配車・役割分担' : '設定'}</h1>
        </div>
                <div className="flex items-center gap-3">
          {saving ? (
            <div className="animate-spin text-white/80"><RotateCw size={20} /></div>
          ) : (
            <button onClick={() => window.location.reload()} className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors">
              <RotateCw size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 relative z-0 -mt-2">
        {currentTab === 'roster' && data && <RosterManager category="roster" data={data} setData={setData} saveAppData={saveAppData} role={role} />}
        {currentTab === 'groups' && data && <RosterManager category="groups" data={data} setData={setData} saveAppData={saveAppData} role={role} />}
        {currentTab === 'duties' && data && <RosterManager category="duties" data={data} setData={setData} saveAppData={saveAppData} role={role} />}
        

        {currentTab === 'schedule' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="pb-6">
            
            
            <div className="sticky top-[calc(68px+env(safe-area-inset-top,0px))] z-20 bg-slate-50/95 backdrop-blur-md pt-3 pb-3 shadow-sm border-b border-slate-200/50 -mx-4 px-4 mb-6">
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex gap-2 overflow-x-auto snap-x hide-scrollbar py-2 px-1 -my-2">
                  {eventDatesList.map((date: string) => {
                    const dateObj = new Date(date);
                    const display = isNaN(dateObj.getTime()) ? date : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "snap-start px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all",
                          selectedDate === date 
                            ? "bg-blue-600 text-white shadow-md scale-105" 
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                        )}
                      >
                        {display}
                      </button>
                    )
                  })}
                </div>
                
                <button onClick={() => setShowRoleFilter(!showRoleFilter)} className={cn("p-2.5 rounded-full border transition-all shrink-0 shadow-sm", showRoleFilter ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
                  <Users size={18} />
                </button>
                <button onClick={exportToExcel} className="p-2.5 rounded-full border transition-all shrink-0 shadow-sm bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" title="Excel出力">
                  <Download size={18} />
                </button>
              </div>

              <AnimatePresence>
                {showRoleFilter && (
                  <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="overflow-hidden">
                    <div className="flex gap-2 overflow-x-auto pb-4 pt-4 hide-scrollbar px-2 mt-2 border-t border-slate-200/50">
                      {['すべて', ...rolesList].map((roleItem: string) => {
                        const isActive = roleFilter === roleItem;
                        const baseStyle = roleItem === 'すべて' 
                          ? "bg-slate-100 text-slate-700 border-slate-200" 
                          : getRoleColor(roleItem);
                        
                        return (
                          <button
                            key={roleItem}
                            onClick={() => setRoleFilter(roleItem)}
                            className={cn(
                              "snap-start px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all border outline-none",
                              baseStyle,
                              isActive ? "ring-2 ring-slate-800 ring-inset shadow-md" : "opacity-80 hover:opacity-100"
                            )}
                          >
                            {roleItem}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">

              <div className="space-y-4">

                <AnimatePresence>
                  {filteredSchedule.map((item: ScheduleItem, index: number) => {
                    const timeStr = item.time.split(' ')[1] || item.time;
                    const filteredNotes = (item.roleNotes || []).filter((n: any) => roleFilter === 'すべて' || n.role === roleFilter);
                    
                    if (filteredNotes.length === 0 && !item.activity && roleFilter !== 'すべて') return null;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("mb-8", index !== 0 && "pt-6 border-t border-slate-200/50")}
                        ref={(el) => { scheduleRefs.current[item.id] = el; }}
                      >
                        {/* Header (Time & Activity) */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="font-extrabold text-blue-600 text-xl tracking-tight bg-blue-50 px-3 py-1 rounded-lg">{timeStr}</div>
                          {item.activity && <div className="font-bold text-slate-800 text-lg flex-1 leading-snug">{item.activity}</div>}
                          
                          {role === 'admin' && (
                            <div className="flex gap-1 shrink-0 ml-auto">
                              <button onClick={() => setScheduleModal({isOpen: true, schedule: item})} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"><Edit2 size={18} /></button>
                              <button onClick={() => {
                                if(confirm('この行程を完全に削除しますか？')) {
                                  updateData({...data!, schedule: data!.schedule!.filter((s: ScheduleItem) => s.id !== item.id)} as AppData);
                                }
                              }} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"><Trash2 size={18} /></button>
                            </div>
                          )}
                        </div>
                        
                        {/* Role Cards */}
                        {(filteredNotes.length > 0 || !item.activity) && (
                          <div className="space-y-3 pl-4 border-l-[3px] border-slate-200 ml-4">
                            {filteredNotes.map((note: any, idx: number) => (
                              <div key={idx} className={cn("p-4 rounded-2xl border shadow-sm relative group", getRoleColor(note.role))}>
                                <div className="font-bold text-sm mb-1.5 opacity-80 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                                  {note.role}
                                </div>
                                <div className="font-bold whitespace-pre-wrap leading-relaxed text-[15px] pr-8">{note.note}</div>
                                
                                {role === 'admin' && (
                                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                    <button onClick={() => setScheduleModal({isOpen: true, schedule: item})} className="p-1.5 hover:bg-black/5 rounded-lg"><Edit2 size={16} /></button>
                                    <button onClick={() => {
                                      if(confirm(`${note.role} の指示のみを削除しますか？`)) {
                                        const newSchedule = data!.schedule.map((s: ScheduleItem) => {
                                          if (s.id === item.id) {
                                            return { ...s, roleNotes: s.roleNotes.filter((n: any) => n.role !== note.role) };
                                          }
                                          return s;
                                        });
                                        updateData({...data!, schedule: newSchedule} as AppData);
                                      }
                                    }} className="p-1.5 hover:bg-black/5 rounded-lg text-red-600/80"><Trash2 size={16} /></button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                  {filteredSchedule.length === 0 && (
                    <div className="text-center py-12 text-slate-400 font-bold">
                      <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
                      この日の予定はありません
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* FAB */}
            {role === 'admin' && (
              <button onClick={() => setScheduleModal({isOpen: true, schedule: null})} className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30">
                <Plus size={28} />
              </button>
            )}
          </motion.div>
        )}

        {currentTab === 'tasks' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="pb-6">
            
            {daysUntil !== null && (
              <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md pt-4 pb-2 px-4 shadow-sm border-b border-slate-200/50 mb-6 mx-[-1rem]">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="font-bold text-slate-600 text-sm flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" />
                    林間学校まであと
                  </div>
                  <div className="font-black text-blue-600 text-2xl flex items-baseline gap-1">
                    {daysUntil} <span className="text-sm font-bold text-slate-500">日</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-6 px-2">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="text-blue-600" /> タスク
              </h2>
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button onClick={() => setTaskView('list')} className={cn("px-4 py-1.5 rounded-lg font-bold text-sm transition-all", taskView === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>一覧</button>
                <button onClick={() => setTaskView('calendar')} className={cn("px-4 py-1.5 rounded-lg font-bold text-sm transition-all", taskView === 'calendar' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>カレンダー</button>
              </div>
            </div>

            {taskView === 'list' && (
              <div className="space-y-8">
                {(() => {
                  const tasksByMonth: {[key: string]: TaskItem[]} = {};
                  data?.tasks.forEach((t: TaskItem) => {
                    const d = new Date(t.deadline);
                    const monthKey = isNaN(d.getTime()) ? '期限未定' : `${d.getFullYear()}年 ${d.getMonth()+1}月`;
                    if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = [];
                    tasksByMonth[monthKey].push(t);
                  });
                  const months = Object.keys(tasksByMonth).sort((a,b) => a.localeCompare(b));
                  
                  if (data?.tasks.length === 0) return <div className="text-center py-12 text-slate-400 font-bold">タスクがありません</div>;

                  return months.map(month => (
                    <div key={month}>
                      <h3 className="font-bold text-slate-700 mb-4 px-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                        {month}
                      </h3>
                      <div className="space-y-3">
                        {tasksByMonth[month].sort((a: any,b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map((task: TaskItem) => (
                          <div key={task.id} className={cn("bg-white rounded-2xl p-5 shadow-sm border transition-all", task.completed ? "border-green-200 bg-green-50/30" : "border-slate-100")}>
                            <div className="flex gap-4 items-start">
                              <button 
                                onClick={() => updateData({...data!, tasks: data!.tasks.map((t: TaskItem) => t.id === task.id ? {...t, completed: !t.completed} : t)} as AppData)} 
                                className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors", task.completed ? "bg-green-500 border-green-500 text-white" : "border-slate-300 text-transparent hover:border-green-500")}
                              >
                                <Check size={18} />
                              </button>
                              <div className="flex-1 space-y-2">
                                <div className={cn("font-bold text-lg leading-tight", task.completed ? "line-through text-slate-400" : "text-slate-800")}>{task.name}</div>
                                <div className="flex flex-wrap gap-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-100">
                                    <Clock size={12} />
                                    {task.deadline.includes('T') ? task.deadline.replace('T', ' ') : task.deadline}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                                    <Users size={12} />
                                    {task.assignee}
                                  </div>
                                </div>
                                {task.memo && (
                                  <div className="text-sm font-medium text-slate-500 bg-slate-50 p-3 rounded-xl mt-2 whitespace-pre-wrap border border-slate-100">
                                    {task.memo}
                                  </div>
                                )}
                                {task.fileUrls && task.fileUrls.length > 0 && (
                                  <div className="flex flex-col gap-1.5 mt-2">
                                    {task.fileUrls.map((url: string, i: number) => (
                                      url ? <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline"><LinkIcon size={14}/> 関連リンク {i+1}</a> : null
                                    ))}
                                  </div>
                                )}
                              </div>
                              {role === 'admin' && (
                                <div className="flex flex-col gap-1 shrink-0">
                                  <button onClick={() => setTaskModal({isOpen: true, task})} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100"><Edit2 size={18} /></button>
                                  <button onClick={() => {
                                    if(confirm('本当に削除しますか？')) updateData({...data!, tasks: data!.tasks.filter((t: TaskItem) => t.id !== task.id)} as AppData);
                                  }} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"><Trash2 size={18} /></button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {taskView === 'calendar' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
                  <div className="font-bold text-lg text-slate-800">{calendarMonth.getFullYear()}年 {calendarMonth.getMonth() + 1}月</div>
                  <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['日','月','火','水','木','金','土'].map(d => <div key={d} className="text-center font-bold text-xs text-slate-400 py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const days = [];
                    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
                    const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
                    for (let i = 0; i < firstDay.getDay(); i++) days.push(<div key={`empty-${i}`} className="p-2"></div>);
                    for (let i = 1; i <= lastDay.getDate(); i++) {
                      const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                      const dayTasks = data?.tasks.filter((t: TaskItem) => t.deadline.startsWith(dateStr)) || [];
                      days.push(
                        <div key={i} className="min-h-[80px] p-1 border border-slate-100 rounded-lg flex flex-col relative group hover:border-blue-300 transition-colors">
                          <span className="text-xs font-bold text-slate-500 mb-1 pl-1">{i}</span>
                          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-1">
                            {dayTasks.map((t: TaskItem) => (
                              <div key={t.id} onClick={() => setTaskModal({isOpen: true, task: t})} className={cn("text-[10px] p-1 rounded font-bold truncate cursor-pointer", t.completed ? "bg-green-100 text-green-700" : "bg-blue-50 text-blue-700 hover:bg-blue-100")}>
                                {t.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>
              </div>
            )}

            {/* FAB */}
            {role === 'admin' && (
              <button onClick={() => setTaskModal({isOpen: true, task: null})} className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30">
                <Plus size={28} />
              </button>
            )}

          </motion.div>
        )}

        {currentTab === 'settings' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="pb-12 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 px-2">
              <Settings className="text-blue-600" /> 設定
            </h2>
            
            {activeSetting === 'menu' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
                  <button onClick={() => setActiveSetting('font')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-3 font-bold text-slate-700"><Type className="text-blue-500" /> 文字サイズ</div>
                    <ChevronRight className="text-slate-400" />
                  </button>
                  {role === 'admin' && (
                    <>
                      <div className="h-px bg-slate-100 mx-4"></div>
                      <button onClick={() => setActiveSetting('schedule')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                        <div className="flex items-center gap-3 font-bold text-slate-700"><CalendarDays className="text-blue-500" /> 行程表の基本設定</div>
                        <ChevronRight className="text-slate-400" />
                      </button>
                      <div className="h-px bg-slate-100 mx-4"></div>
                      <button onClick={() => setActiveSetting('roles')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                        <div className="flex items-center gap-3 font-bold text-slate-700"><Users className="text-blue-500" /> 役割リスト管理</div>
                        <ChevronRight className="text-slate-400" />
                      </button>
                      <div className="h-px bg-slate-100 mx-4"></div>
                      <button onClick={() => setActiveSetting('tasks')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                        <div className="flex items-center gap-3 font-bold text-slate-700"><CheckSquare className="text-blue-500" /> タスク担当者リスト管理</div>
                        <ChevronRight className="text-slate-400" />
                      </button>
                      <div className="h-px bg-slate-100 mx-4"></div>
                      <button onClick={() => setActiveSetting('accounts')} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                        <div className="flex items-center gap-3 font-bold text-slate-700"><UserPlus className="text-blue-500" /> アカウント管理</div>
                        <ChevronRight className="text-slate-400" />
                      </button>
                    </>
                  )}
                </div>
                
                <div className="pt-4 px-2">
                  <button onClick={() => { logout(); window.location.href = '/login'; }} className="w-full flex justify-center items-center gap-2 p-4 rounded-2xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                    <LogOut size={20} /> ログアウト
                  </button>
                </div>
              </div>
            )}

            {activeSetting !== 'menu' && (
              <div className="mb-4">
                <button onClick={() => setActiveSetting('menu')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-2 py-1 rounded-lg hover:bg-slate-200/50 transition-colors">
                  <ChevronLeft size={20} /> 戻る
                </button>
              </div>
            )}

            {activeSetting === 'font' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4">文字サイズ設定</h3>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                  {(['text-sm', 'text-base', 'text-lg'] as const).map((sz) => (
                    <button key={sz} onClick={() => setFontSize(sz)} className={cn("flex-1 py-3 rounded-lg font-bold transition-all", fontSize === sz ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                      {sz === 'text-sm' ? '小' : sz === 'text-base' ? '中' : '大'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSetting === 'schedule' && role === 'admin' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4">行程表の基本設定</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">林間学校の開始日</label>
                    <input type="date" value={data?.startDate || ''} onChange={(e) => {
                      updateData({...data!, startDate: e.target.value} as AppData);
                      toast.success('開始日を保存しました');
                    }} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium" />
                    <p className="text-xs text-slate-400 mt-1">※タスク画面のカウントダウンに使用されます</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-2">行程表の日程タブ一覧</label>
                    <div className="space-y-2 mb-3">
                      {(data?.eventDates || []).map((dateStr: string, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-700">{dateStr}</span>
                          <button onClick={() => {
                            if(confirm('削除しますか？')) {
                              updateData({...data!, eventDates: (data?.eventDates || []).filter((_, idx: number) => idx !== i)} as AppData);
                            }
                          }} className="text-red-500 p-2"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const newVal = fd.get('newVal') as string;
                      if (newVal) {
                        updateData({...data!, eventDates: [...(data?.eventDates || []), newVal]} as AppData);
                        e.currentTarget.reset();
                      }
                    }} className="flex gap-2">
                      <input name="newVal" placeholder="例: 2026-08-01" required className="flex-1 p-3 rounded-xl border border-slate-200 outline-none font-medium" />
                      <button type="submit" className="px-4 bg-slate-800 text-white font-bold rounded-xl"><Plus size={20}/></button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {activeSetting === 'roles' && role === 'admin' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4">役割リスト管理</h3>
                <div className="space-y-2 mb-4">
                  {rolesList.map((r: string, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">{r}</span>
                      <button onClick={() => {
                        if(confirm('削除しますか？')) {
                          updateData({...data!, roles: rolesList.filter((_, idx: number) => idx !== i)} as AppData);
                        }
                      }} className="text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const newVal = fd.get('newVal') as string;
                  if (newVal) {
                    updateData({...data!, roles: [...rolesList, newVal]} as AppData);
                    e.currentTarget.reset();
                  }
                }} className="flex gap-2">
                  <input name="newVal" placeholder="新しい役割名" required className="flex-1 p-3 rounded-xl border border-slate-200 outline-none font-medium" />
                  <button type="submit" className="px-4 bg-slate-800 text-white font-bold rounded-xl"><Plus size={20}/></button>
                </form>
              </div>
            )}

            {activeSetting === 'tasks' && role === 'admin' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4">タスク担当者リスト管理</h3>
                <div className="space-y-2 mb-4">
                  {taskAssigneesList.map((r: string, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">{r}</span>
                      <button onClick={() => {
                        if(confirm('削除しますか？')) {
                          updateData({...data!, taskAssignees: taskAssigneesList.filter((_, idx: number) => idx !== i)} as AppData);
                        }
                      }} className="text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const newVal = fd.get('newVal') as string;
                  if (newVal) {
                    updateData({...data!, taskAssignees: [...taskAssigneesList, newVal]} as AppData);
                    e.currentTarget.reset();
                  }
                }} className="flex gap-2">
                  <input name="newVal" placeholder="新しい担当者名" required className="flex-1 p-3 rounded-xl border border-slate-200 outline-none font-medium" />
                  <button type="submit" className="px-4 bg-slate-800 text-white font-bold rounded-xl"><Plus size={20}/></button>
                </form>
              </div>
            )}

            {activeSetting === 'accounts' && role === 'admin' && (
              <div className="space-y-6">
                
                {/* Invite Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 shadow-sm border border-blue-100">
                  <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Link2 size={18}/> 招待リンクの発行</h3>
                  <p className="text-xs text-blue-700/80 mb-4 leading-relaxed">
                    このリンクをLINE等で送ることで、新しい管理者が自分で名前・ID・パスワードを決めて登録できます。（リンクは24時間有効です）
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button onClick={async () => {
                      const token = await generateInviteToken('admin');
                      const url = window.location.origin + '/register?token=' + token;
                      const text = `関西林間アプリの【全体管理者】招待です。以下のリンクからアカウントを登録してください。\n${url}`;
                      try {
                        await navigator.clipboard.writeText(text);
                        toast.success('全体管理者用の招待文をコピーしました！LINE等で共有してください');
                      } catch(e) {
                        prompt('以下のテキストをコピーしてください', text);
                      }
                    }} className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl hover:bg-amber-600 transition-colors shadow-md flex items-center justify-center gap-2">
                      <Shield size={18}/> 管理者として招待
                    </button>
                    
                    <button onClick={async () => {
                      const token = await generateInviteToken('editor');
                      const url = window.location.origin + '/register?token=' + token;
                      const text = `関西林間アプリの【編集者】招待です。以下のリンクからアカウントを登録してください。\n${url}`;
                      try {
                        await navigator.clipboard.writeText(text);
                        toast.success('編集者用の招待文をコピーしました！LINE等で共有してください');
                      } catch(e) {
                        prompt('以下のテキストをコピーしてください', text);
                      }
                    }} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2">
                      <Edit3 size={18}/> 編集者として招待
                    </button>
                  </div>
                </div>

                {/* Admins List */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-4">アカウント管理</h3>
                  <div className="space-y-3 mb-6">
                    {usersList.map((u: User) => (
                      <div key={u.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <div className="font-bold text-slate-700 flex items-center gap-2">
                            {u.name || '名前未設定'} 
                            {u.role === 'admin' ? (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Shield size={10}/>全体管理者</span>
                            ) : (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Edit3 size={10}/>編集者</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">ID: {u.username}</div>
                        </div>
                        <button onClick={async () => {
                          if(confirm(u.username + 'を削除しますか？')) {
                            const res = await deleteUser(u.id);
                            if (res.success) getUsers().then(setUsersList);
                            else toast.error(res.error);
                          }
                        }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <LogOut size={18} className="text-emerald-600"/> 閲覧者パスワード設定
                    </h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const p = fd.get('password') as string;
                      if(p) {
                        await updateViewerPassword(p);
                        toast.success('変更しました');
                        e.currentTarget.reset();
                      }
                    }} className="flex gap-2 mb-4">
                      <input name="password" placeholder="新しい閲覧パスワード" required className="flex-1 p-3 rounded-xl border border-slate-200 outline-none font-medium" />
                      <button type="submit" className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">変更</button>
                    </form>
                    
                    <button onClick={async () => {
                      const pwd = await getViewerPassword();
                      const url = window.location.origin + '/login?vp=' + encodeURIComponent(pwd);
                      const text = `関西林間アプリの【閲覧用】招待です。以下のURLを開き、「閲覧モードで入る」ボタンを押してください。\n\n${url}\n\nパスワード: ${pwd}`;
                      try {
                        await navigator.clipboard.writeText(text);
                        toast.success('閲覧者用の招待文をコピーしました！LINE等で共有してください');
                      } catch(e) {
                        prompt('以下のテキストをコピーしてください', text);
                      }
                    }} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-900 transition-colors shadow-md flex items-center justify-center gap-2">
                      <Eye size={18}/> 閲覧者の招待リンクを作成してコピー
                    </button>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation */}
      <TaskModalContent 
        taskModal={taskModal}
        setTaskModal={setTaskModal}
        taskAssigneesList={taskAssigneesList}
        data={data}
        updateData={updateData}
      />

      <ScheduleModalContent 
        scheduleModal={scheduleModal}
        setScheduleModal={setScheduleModal}
        selectedDate={selectedDate}
        eventDatesList={eventDatesList}
        rolesList={rolesList}
        data={data}
        updateData={updateData}
      />
    </div>
  );
}

function TaskModalContent({ taskModal, setTaskModal, taskAssigneesList, data, updateData }: any) {
  const [fileUrls, setFileUrls] = useState<string[]>(['']);
  
  useEffect(() => {
    if (taskModal.isOpen) {
      setFileUrls(taskModal.task?.fileUrls && taskModal.task.fileUrls.length > 0 ? taskModal.task.fileUrls : ['']);
    }
  }, [taskModal.isOpen, taskModal.task]);

  if (!taskModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{taskModal.task ? 'タスクを編集' : 'タスクを追加'}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = fd.get('name') as string;
          const deadline = fd.get('deadline') as string;
          const assignee = fd.get('assignee') as string;
          const memo = fd.get('memo') as string;
          
          const filteredUrls = fileUrls.map(u => u.trim()).filter(Boolean);
          
          if (taskModal.task) {
            // Edit
            const newTasks = data!.tasks.map((t: TaskItem) => t.id === taskModal.task!.id ? { ...t, name, deadline, assignee, memo, fileUrls: filteredUrls } : t);
            updateData({...data!, tasks: newTasks} as AppData);
          } else {
            // Add
            const newTask = {
              id: 't' + Date.now(),
              name,
              deadline,
              assignee,
              memo,
              fileUrls: filteredUrls,
              completed: false
            };
            updateData({...data!, tasks: [newTask, ...data!.tasks]} as AppData);
          }
          setTaskModal({isOpen: false, task: null});
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">タスク名 <span className="text-red-500">*</span></label>
            <input name="name" required defaultValue={taskModal.task?.name} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-600 mb-1">期限 <span className="text-red-500">*</span></label>
              <input type="datetime-local" name="deadline" required defaultValue={taskModal.task?.deadline ? taskModal.task.deadline.replace(' ', 'T') : ''} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-600 mb-1">担当者 <span className="text-red-500">*</span></label>
              <select name="assignee" required defaultValue={taskModal.task?.assignee} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none">
                {taskAssigneesList.map((a: string) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">メモ</label>
            <textarea name="memo" rows={2} defaultValue={taskModal.task?.memo} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none resize-none" placeholder="補足事項など" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">関連URL</label>
            <div className="space-y-2">
              {fileUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="url" value={url} onChange={e => {
                    const newUrls = [...fileUrls];
                    newUrls[i] = e.target.value;
                    setFileUrls(newUrls);
                  }} className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none text-sm" placeholder="https://" />
                  <button type="button" onClick={() => {
                    setFileUrls(fileUrls.filter((_, idx) => idx !== i));
                  }} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setFileUrls([...fileUrls, ''])} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1">
                <Plus size={16} /> 関連URLを追加
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setTaskModal({isOpen: false, task: null})} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100">キャンセル</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600">保存する</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ScheduleModalContent({ scheduleModal, setScheduleModal, selectedDate, eventDatesList, rolesList, data, updateData }: any) {
  const [draftRoleNotes, setDraftRoleNotes] = useState<{role: string; note: string}[]>([]);
  
  useEffect(() => {
    if (scheduleModal.isOpen) {
      setDraftRoleNotes(scheduleModal.schedule?.roleNotes || []);
    }
  }, [scheduleModal.isOpen, scheduleModal.schedule]);

  if (!scheduleModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{scheduleModal.schedule ? '行程を編集' : '行程を追加'}</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const date = fd.get('date') as string;
          const timeStr = fd.get('time') as string;
          const activity = fd.get('activity') as string;
          
          const roleNotes = draftRoleNotes.filter(n => n.role && n.note.trim() !== '');
          const time = `${date} ${timeStr}`;

          if (scheduleModal.schedule) {
            const newSchedule = data!.schedule.map((s: any) => s.id === scheduleModal.schedule.id ? { ...s, time, activity, roleNotes } : s);
            updateData({...data!, schedule: newSchedule} as AppData);
          } else {
            const newItem = {
              id: 's' + Date.now(),
              time,
              activity,
              roleNotes
            };
            updateData({...data!, schedule: [...data!.schedule, newItem].sort((a: any, b: any) => a.time.localeCompare(b.time))} as AppData);
          }
          setScheduleModal({isOpen: false, schedule: null});
        }} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-600 mb-1">日程 <span className="text-red-500">*</span></label>
              <select name="date" defaultValue={scheduleModal.schedule ? scheduleModal.schedule.time.split(' ')[0] : selectedDate} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold">
                {eventDatesList.map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-600 mb-1">時間 <span className="text-red-500">*</span></label>
              <input type="time" name="time" required defaultValue={scheduleModal.schedule?.time.split(' ')[1] || '12:00'} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">活動内容</label>
            <input name="activity" defaultValue={scheduleModal.schedule?.activity} placeholder="活動名を入力" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none" />
          </div>
          
          <div className="border-t pt-4 mt-2">
            <label className="block text-sm font-bold text-slate-600 mb-3">役割ごとの指示</label>
            <div className="space-y-3">
              {draftRoleNotes.map((note, index) => (
                <div key={index} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-center">
                    <select 
                      value={note.role} 
                      onChange={e => {
                        const newDraft = [...draftRoleNotes];
                        newDraft[index].role = e.target.value;
                        setDraftRoleNotes(newDraft);
                      }}
                      className="bg-white border border-slate-200 rounded-lg p-1.5 text-sm font-bold text-slate-700 outline-none"
                    >
                      <option value="" disabled>役割を選択...</option>
                      {rolesList.filter((r: string) => r !== '全員' && r !== '責任者').map((r: string) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button type="button" onClick={() => {
                      const newDraft = draftRoleNotes.filter((_, i) => i !== index);
                      setDraftRoleNotes(newDraft);
                    }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                  </div>
                  <textarea 
                    value={note.note}
                    onChange={e => {
                      const newDraft = [...draftRoleNotes];
                      newDraft[index].note = e.target.value;
                      setDraftRoleNotes(newDraft);
                    }}
                    rows={2} 
                    className="w-full p-2 rounded-lg bg-white border border-slate-200 outline-none text-sm resize-none" 
                    placeholder="指示をここに入力" 
                  />
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => setDraftRoleNotes([...draftRoleNotes, {role: '', note: ''}])}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> 役割の指示を追加
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setScheduleModal({isOpen: false, schedule: null})} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100">キャンセル</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600">保存する</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

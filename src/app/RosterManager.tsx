"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Users, Plus, Trash2, Edit2, X, AlertCircle, Save } from 'lucide-react';
import { AppData, Participant, CustomBucket } from './actions';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import facilitiesData from './facilities.json';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type Category = 'roster' | 'groups' | 'duties';
type Mode = 'dashboard' | 'manage' | 'export' | 'life' | 'study' | 'room' | 'car' | 'youthRole' | 'studentRole';

type RosterManagerProps = {
  category: Category;
  data: AppData;
  setData: (data: AppData) => void;
  saveAppData: (data: AppData) => void;
  role: 'admin' | 'editor' | 'viewer' | 'none';
};

export default function RosterManager({ category, data, setData, saveAppData, role }: RosterManagerProps) {
  const defaultMode = category === 'roster' ? 'dashboard' : category === 'groups' ? 'life' : 'car';
  const [mode, setMode] = useState<Mode>(defaultMode);
  
  // Ensure mode matches category on unmount/mount
  useEffect(() => {
    setMode(category === 'roster' ? 'dashboard' : category === 'groups' ? 'life' : 'car');
  }, [category]);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState<AppData>(data);
  const [modal, setModal] = useState<{isOpen: boolean, type: 'study'|'car'|'studentRole'|'youthRole', name: string, capacity: string}>({isOpen: false, type: 'study', name: '', capacity: ''});
  
  useEffect(() => {
    if (!isEditing) setLocalData(data);
  }, [data, isEditing]);

  const participants = (isEditing ? localData.participants : data.participants) || [];

  const updateLocal = (newData: AppData) => {
    setLocalData(newData);
  };

  const handleSave = () => {
    setData(localData);
    saveAppData(localData);
    setIsEditing(false);
    toast.success('保存しました');
  };

  const updateParticipants = (newParticipants: Participant[]) => {
    if (isEditing) {
      updateLocal({ ...localData, participants: newParticipants });
    } else {
      const newData = { ...data, participants: newParticipants };
      setData(newData);
      saveAppData(newData);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  
  // Find duplicates
  const getDuplicates = () => {
    const nameMap = new Map<string, Participant[]>();
    participants.forEach(p => {
      const norm = p.name.replace(/[\s　]+/g, '');
      if(!nameMap.has(norm)) nameMap.set(norm, []);
      nameMap.get(norm)!.push(p);
    });
    return Array.from(nameMap.values()).filter(group => group.length > 1);
  };
  const duplicates = getDuplicates();

  const handleMergeDuplicates = (group: Participant[]) => {
    if(confirm(`${group[0].name} が ${group.length} 件重複しています。1件に統合しますか？`)) {
      const primary = group[0];
      const mergedAllocations = {};
      group.forEach(p => {
        Object.assign(mergedAllocations, p.allocations);
      });
      primary.allocations = mergedAllocations;
      const idsToRemove = group.slice(1).map(p => p.id);
      const newParticipants = participants.filter(p => !idsToRemove.includes(p.id));
      const finalParticipants = newParticipants.map(p => p.id === primary.id ? primary : p);
      updateParticipants(finalParticipants);
      toast.success('重複を統合しました');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, pType: 'student' | 'youth') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const json = XLSX.utils.sheet_to_json<any>(ws);
        
        const newParticipants: Participant[] = json.map((row, idx) => ({
          id: `${pType}_${Date.now()}_${idx}`,
          type: pType,
          name: row['参加者氏名'] || row['氏名'] || '無名',
          gender: row['性別'] || '-',
          grade: row['学年'] || '-',
          raw: row,
          allocations: {}
        }));
        
        const filtered = (data.participants || []).filter(p => p.type !== pType);
        const newData = { 
          ...data, 
          participants: [...filtered, ...newParticipants],
          timestamps: {
            ...(data.timestamps || {}),
            [pType === 'student' ? 'rosterStudent' : 'rosterYouth']: new Date().toISOString()
          }
        };
        setData(newData);
        saveAppData(newData);
        toast.success(`${pType === 'student' ? '学生部' : '青年部'}のデータを${newParticipants.length}件取り込みました`);
      } catch (err) {
        toast.error('Excelの読み込みに失敗しました');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportCurrentModeExcel = () => {
    if (participants.length === 0) {
      toast.error('エクスポートするデータがありません');
      return;
    }
    
    const d = isEditing ? localData : data;
    const lifeGroups = d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}班` }));
    const studyGroups = d.studyGroups || [];
    const rooms = getActiveRooms(d);
    const cars = d.cars || [];
    const youthRoles = [
      {id:'保健', name:'保健'},{id:'お茶', name:'お茶'},{id:'生活', name:'生活'},
      {id:'飯・キャ', name:'飯・キャ'},{id:'見守り', name:'見守り'}
    ];
    const studentRoles = d.studentRoles || [];

    const getName = (list: any[], id?: string) => list.find(x => x.id === id)?.name || '';

    // Filter and map based on current mode
    let exportData: any[] = [];
    let sheetName = "";
    
    if (mode === 'life') {
      sheetName = "班編成";
      exportData = participants.filter(p => p.allocations.group).map(p => ({
        '区分': p.type === 'student' ? '学生部' : '青年部・一般',
        '氏名': p.name,
        '性別': p.gender,
        '学年': p.grade,
        '班': getName(lifeGroups, p.allocations.group),
        '役職': p.allocations.groupRole === 'scarf' ? 'スカーフ' : p.allocations.groupRole === 'leader' ? '班長' : '',
        'アレルギー・備考': p.raw['備考欄'] || p.raw['備考'] || ''
      })).sort((a, b) => String(a['班'] || '').localeCompare(String(b['班'] || '')));
    } else if (mode === 'study') {
      sheetName = "勉強会班";
      exportData = participants.filter(p => p.allocations.studyGroup).map(p => ({
        '氏名': p.name,
        '性別': p.gender,
        '学年': p.grade,
        '勉強会班': getName(studyGroups, p.allocations.studyGroup)
      })).sort((a, b) => String(a['勉強会班'] || '').localeCompare(String(b['勉強会班'] || '')));
    } else if (mode === 'room') {
      sheetName = "部屋割";
      exportData = participants.filter(p => p.allocations.room).map(p => ({
        '氏名': p.name,
        '性別': p.gender,
        '部屋': getName(rooms, p.allocations.room),
        '役職': p.allocations.roomRole === 'room_leader' ? '室長' : ''
      })).sort((a, b) => String(a['部屋'] || '').localeCompare(String(b['部屋'] || '')));
    } else if (mode === 'car') {
      sheetName = "配車";
      exportData = participants.filter(p => p.allocations.car).map(p => ({
        '氏名': p.name,
        '車': getName(cars, p.allocations.car)
      })).sort((a, b) => String(a['車'] || '').localeCompare(String(b['車'] || '')));
    } else if (mode === 'youthRole') {
      sheetName = "青年部役割";
      exportData = participants.filter(p => p.type === 'youth' && p.allocations.youthRole).map(p => ({
        '氏名': p.name,
        '役割': p.allocations.youthRole
      })).sort((a, b) => String(a['役割'] || '').localeCompare(String(b['役割'] || '')));
    } else if (mode === 'studentRole') {
      sheetName = "学生部役割";
      exportData = participants.filter(p => p.type === 'student' && p.allocations.studentRole).map(p => ({
        '氏名': p.name,
        '役割': getName(studentRoles, p.allocations.studentRole)
      })).sort((a, b) => String(a['役割'] || '').localeCompare(String(b['役割'] || '')));
    }

    if (exportData.length === 0) {
      toast.error('エクスポートするデータがありません（誰も配属されていません）');
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `林間_${sheetName}.xlsx`);
  };

  const exportTemplateExcel = (onlyAllergy: boolean) => {
    if (participants.length === 0) {
      toast.error('エクスポートするデータがありません');
      return;
    }
    
    const d = isEditing ? localData : data;
    const lifeGroups = d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}班` }));
    const rooms = getActiveRooms(d);
    const getName = (list: any[], id?: string) => list.find(x => x.id === id)?.name || '';

    let targetParticipants = participants;
    if (onlyAllergy) {
      targetParticipants = participants.filter(p => {
        const note = String(p.raw['備考欄'] || p.raw['備考'] || '');
        return note.trim().length > 0;
      });
    }

    const exportData = targetParticipants.map((p, idx) => ({
      'No.': idx + 1,
      'ふりがな': p.raw['参加者氏名（フリガナ）'] || p.raw['氏名（フリガナ）'] || '',
      '氏名': p.name,
      '性別': p.gender,
      '学年/年齢': p.grade,
      '所属（支部）': p.raw['所属系統・支部名'] || '',
      '班': getName(lifeGroups, p.allocations.group),
      '部屋': getName(rooms, p.allocations.room),
      'アレルギー・特記事項': p.raw['備考欄'] || p.raw['備考'] || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "利用者名簿");
    XLSX.writeFile(wb, `佛所護念会_利用者名簿${onlyAllergy ? '_アレルギー等' : ''}.xlsx`);
  };

  // Drag and Drop Engine
  const handleDragStart = (e: React.DragEvent, id: string, type: 'participant' | 'bucket' = 'participant') => {
    e.dataTransfer.setData('text/plain', `${type}:${id}`);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, bucketId: string, allocationKey: keyof Participant['allocations']) => {
    e.preventDefault();
    if (role !== 'admin' || !isEditing) return;
    
    const dataStr = e.dataTransfer.getData('text/plain');
    if (!dataStr) return;
    
    // Support legacy participant dragging before we prefixed with type
    let type = 'participant';
    let id = dataStr;
    if (dataStr.includes(':')) {
      [type, id] = dataStr.split(':');
    }

    if (type === 'participant') {
      const pId = id;
      const newParticipants = participants.map(p => {
        if (p.id === pId) {
          return {
            ...p,
            allocations: {
              ...p.allocations,
              [allocationKey]: bucketId === 'unassigned' ? undefined : bucketId
            }
          };
        }
        return p;
      });
      updateParticipants(newParticipants);
    } else if (type === 'bucket') {
      const sourceBucketId = id;
      const targetBucketId = bucketId;
      if (sourceBucketId === targetBucketId || targetBucketId === 'unassigned') return;
      
      let bucketsArrayKey = '';
      if (allocationKey === 'group') bucketsArrayKey = 'lifeGroups';
      else if (allocationKey === 'studyGroup') bucketsArrayKey = 'studyGroups';
      else if (allocationKey === 'youthRole') bucketsArrayKey = 'youthRoles';
      else if (allocationKey === 'studentRole') bucketsArrayKey = 'studentRoles';
      else if (allocationKey === 'car') bucketsArrayKey = 'cars';
      else return; 

      const d = isEditing ? localData : data;
      let currentBuckets = [...(d[bucketsArrayKey as keyof AppData] as CustomBucket[] || [])];
      
      // Fallback for missing lifeGroups
      if (bucketsArrayKey === 'lifeGroups' && currentBuckets.length === 0) {
         currentBuckets = Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}班` }));
      }
      
      const sourceIdx = currentBuckets.findIndex(b => b.id === sourceBucketId);
      const targetIdx = currentBuckets.findIndex(b => b.id === targetBucketId);
      if (sourceIdx === -1 || targetIdx === -1) return;
      
      const [moved] = currentBuckets.splice(sourceIdx, 1);
      currentBuckets.splice(targetIdx, 0, moved);
      
      if (allocationKey === 'group') {
        currentBuckets.forEach((b, idx) => {
          b.name = `${idx + 1}班`;
        });
      }
      
      updateLocal({...d, [bucketsArrayKey]: currentBuckets});
    }
  };

  const getActiveRooms = (d: AppData) => {
    let rooms: CustomBucket[] = [];
    (d.activeBuildings || []).forEach(b => {
      const bRooms = (facilitiesData as any)[b];
      if (bRooms) {
        bRooms.forEach((r: any) => {
          // r.floor might be mojibake or real text (e.g. "1階"), we just show it safely
          const floorStr = r.floor ? `${r.floor.replace(/[^0-9]/g, '')}階` : '';
          rooms.push({ id: `room_${b}_${r.name}`, name: `${b} ${floorStr} - ${r.name}`, capacity: r.capacity });
        });
      }
    });
    return rooms;
  };

  const renderBoard = (
    allocationKey: keyof Participant['allocations'], 
    buckets: CustomBucket[], 
    allowRoleToggles: 'life' | 'room' | 'none' = 'none'
  ) => {
    let unassigned = participants.filter(p => !p.allocations[allocationKey]);
    if (allocationKey === 'youthRole') unassigned = unassigned.filter(p => p.type === 'youth');
    if (allocationKey === 'studentRole' || allocationKey === 'studyGroup') unassigned = unassigned.filter(p => p.type === 'student');
    
    return (
      <div className="flex flex-col lg:flex-row gap-6 min-h-[60vh] w-full items-start">
        {/* Unassigned List */}
        <div 
          className="w-full lg:w-72 shrink-0 bg-slate-100/80 rounded-2xl p-4 flex flex-col max-h-[80vh] border border-slate-200 shadow-inner sticky top-[140px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'unassigned', allocationKey)}
        >
          <div className="font-bold text-slate-700 mb-3 flex justify-between items-center">
            <span className="text-sm uppercase tracking-wider">未配属リスト</span>
            <span className="bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{unassigned.length}名</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 hide-scrollbar">
            {unassigned.map(p => (
              <div 
                key={p.id} 
                draggable={role === 'admin' && isEditing}
                onDragStart={(e) => handleDragStart(e, p.id)}
                className={cn("bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center", isEditing ? "cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all" : "")}
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{p.gender} / {p.grade} / {p.type === 'student' ? '学生' : '青年'}</div>
                </div>
              </div>
            ))}
            {unassigned.length === 0 && <div className="text-slate-400 text-xs text-center pt-8">全員配属済みです</div>}
          </div>
        </div>

        {/* Buckets List (Kanban Flex Wrap) */}
        <div className="flex-1 flex flex-wrap gap-4 w-full">
          {buckets.map(bucket => {
            const assigned = participants.filter(p => p.allocations[allocationKey] === bucket.id);
            const isOverCapacity = bucket.capacity && assigned.length > bucket.capacity;
            
            return (
              <div 
                key={bucket.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, bucket.id, allocationKey)}
                draggable={role === 'admin' && isEditing && allocationKey !== 'room'}
                onDragStart={(e) => handleDragStart(e, bucket.id, 'bucket')}
                className={cn(
                  "w-full sm:w-[calc(50%-8px)] md:w-[calc(33.333%-11px)] xl:w-64 rounded-2xl p-4 flex flex-col border transition-all shadow-sm",
                  isOverCapacity ? "bg-red-50/80 border-red-200" : "bg-white border-slate-200",
                  (role === 'admin' && isEditing && allocationKey !== 'room') ? "cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md" : ""
                )}
                style={{ minHeight: '300px' }}
              >
                <div className="font-bold text-slate-800 mb-1 flex justify-between items-center text-lg">
                  {bucket.name}
                </div>
                <div className="text-xs text-slate-500 mb-4 flex justify-between items-center border-b border-slate-100 pb-2 font-medium">
                  <span>{assigned.length}名</span>
                  {bucket.capacity && (
                    <span className={cn(isOverCapacity ? "text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded" : "")}>定員: {bucket.capacity}名</span>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  {assigned.map(p => (
                    <div 
                      key={p.id}
                      draggable={role === 'admin' && isEditing}
                      onDragStart={(e) => handleDragStart(e, p.id)}
                      className={cn("bg-slate-50 p-3 rounded-xl border border-slate-200 group relative", isEditing ? "cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all" : "")}
                    >
                      <div className="font-bold text-slate-700 text-sm flex justify-between">
                        {p.name}
                        <span className="text-[9px] text-slate-400 font-normal">{p.grade}</span>
                      </div>
                      
                      {/* Role Toggles */}
                      {allowRoleToggles === 'life' && role === 'admin' && isEditing && (
                        <div className="mt-2 flex gap-1">
                          <button onClick={() => toggleRole(p.id, 'groupRole', 'scarf')} className={cn("text-[10px] px-2 py-1 rounded-md border transition-colors font-bold", p.allocations.groupRole === 'scarf' ? "bg-blue-500 border-blue-600 text-white shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100")}>スカーフ</button>
                          <button onClick={() => toggleRole(p.id, 'groupRole', 'leader')} className={cn("text-[10px] px-2 py-1 rounded-md border transition-colors font-bold", p.allocations.groupRole === 'leader' ? "bg-amber-500 border-amber-600 text-white shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100")}>班長</button>
                        </div>
                      )}
                      
                      {allowRoleToggles === 'room' && role === 'admin' && isEditing && (
                        <div className="mt-2 flex gap-1">
                          <button onClick={() => toggleRole(p.id, 'roomRole', 'room_leader')} className={cn("text-[10px] px-2 py-1 rounded-md border transition-colors font-bold", p.allocations.roomRole === 'room_leader' ? "bg-purple-500 border-purple-600 text-white shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100")}>室長</button>
                        </div>
                      )}
                      
                      {/* Readonly badges */}
                      {(!isEditing || role !== 'admin') && p.allocations.groupRole === 'scarf' && <div className="mt-1.5 text-[10px] font-bold text-white bg-blue-500 inline-block px-2 py-0.5 rounded-md">スカーフ</div>}
                      {(!isEditing || role !== 'admin') && p.allocations.groupRole === 'leader' && <div className="mt-1.5 text-[10px] font-bold text-white bg-amber-500 inline-block px-2 py-0.5 rounded-md">班長</div>}
                      {(!isEditing || role !== 'admin') && p.allocations.roomRole === 'room_leader' && <div className="mt-1.5 text-[10px] font-bold text-white bg-purple-500 inline-block px-2 py-0.5 rounded-md">室長</div>}
                    </div>
                  ))}
                  {assigned.length === 0 && <div className="text-slate-400 text-xs text-center pt-4">ドラッグして追加</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const toggleRole = (pId: string, roleKey: 'groupRole' | 'roomRole', roleVal: string) => {
    const newParticipants = participants.map(p => {
      if (p.id === pId) {
        return {
          ...p,
          allocations: {
            ...p.allocations,
            [roleKey]: p.allocations[roleKey] === roleVal ? null : roleVal
          }
        };
      }
      return p;
    });
    updateParticipants(newParticipants);
  };

  const submitModal = () => {
    if (!modal.name) return;
    const cap = parseInt(modal.capacity) || undefined;
    const d = isEditing ? localData : data;
    
    if (modal.type === 'study') {
      updateLocal({...d, studyGroups: [...(d.studyGroups||[]), {id: `study_${Date.now()}`, name: modal.name}]});
    } else if (modal.type === 'car') {
      updateLocal({...d, cars: [...(d.cars||[]), {id: `car_${Date.now()}`, name: modal.name, capacity: cap}]});
    } else if (modal.type === 'studentRole') {
      updateLocal({...d, studentRoles: [...(d.studentRoles||[]), {id: `srole_${Date.now()}`, name: modal.name}]});
    }
    setModal({isOpen: false, type: 'study', name: '', capacity: ''});
  };

  const getModeLabel = () => {
    if (mode === 'life') return '班';
    if (mode === 'study') return '勉強会班';
    if (mode === 'room') return '部屋割';
    if (mode === 'car') return '配車';
    if (mode === 'youthRole') return '青年部役割';
    if (mode === 'studentRole') return '学生部役割';
    return '';
  };

  const renderTabs = () => {
    const modes = category === 'roster'
      ? [{id: 'dashboard', label: 'ダッシュボード'}, {id: 'manage', label: '名簿管理'}, {id: 'export', label: '出力・絞り込み'}]
      : category === 'groups' 
      ? [{id: 'life', label: '班'}, {id: 'study', label: '勉強会班'}, {id: 'room', label: '部屋割'}]
      : [{id: 'car', label: '配車'}, {id: 'youthRole', label: '青年部役割'}, {id: 'studentRole', label: '学生部役割'}];

    return (
      <div className="flex gap-2 pb-4 pt-2 -mx-2 px-2 overflow-x-auto hide-scrollbar">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => {
              if (isEditing) {
                if(confirm('編集中の内容は破棄されます。よろしいですか？')) {
                  setIsEditing(false);
                  setLocalData(data);
                  setMode(m.id as Mode);
                }
              } else {
                setMode(m.id as Mode);
              }
            }}
            className={cn(
              "px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm",
              mode === m.id 
                ? "bg-blue-600 text-white scale-105" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
    );
  };

  const d = isEditing ? localData : data;

  return (
    <div className="pb-12 h-full flex flex-col">
      {/* Dynamic Tabs based on Category */}
      <div className="sticky top-[calc(68px+env(safe-area-inset-top,0px))] z-20 bg-slate-50/95 backdrop-blur-md shadow-sm border-b border-slate-200/50 -mx-4 px-4 md:-mx-6 md:px-6 mb-6">
        {renderTabs()}
        
        {/* ACTION BAR (Under Tabs, Right Aligned) */}
        {category !== 'roster' && (
          <div className="flex justify-end items-center gap-2 pb-3 mt-1">
            {role !== 'viewer' && role !== 'none' && (
              <button onClick={exportCurrentModeExcel} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm mr-auto">
                <Download size={16}/> {getModeLabel()} エクセル出力
              </button>
            )}
            
            {role === 'admin' && (
              <>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm">
                    <Edit2 size={16}/> 編集
                  </button>
                ) : (
                  <>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                      <Save size={16}/> 保存
                    </button>
                    <button onClick={() => {setIsEditing(false); setLocalData(data);}} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors">
                      キャンセル
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 md:p-6 mb-6 flex-1 flex flex-col">
        {/* ROSTER MODE */}
        {category === 'roster' && (
          <div className="space-y-6 flex-1">
            {mode === 'dashboard' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Users size={20} className="text-blue-600"/> 参加者ダッシュボード</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                    <div className="text-slate-500 font-bold mb-2">総参加人数</div>
                    <div className="text-5xl font-black text-blue-600">{participants.length} <span className="text-lg text-slate-400">人</span></div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-slate-500 font-bold mb-4 text-center">所属別 内訳</div>
                    <div className="flex justify-between items-center px-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-emerald-600">{participants.filter(p => p.type === 'student').length}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">学生部</div>
                      </div>
                      <div className="h-12 w-px bg-slate-200"></div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-amber-600">{participants.filter(p => p.type === 'youth').length}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">青年部・一般</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-slate-500 font-bold mb-4 text-center">男女比 (全体)</div>
                    <div className="flex justify-between items-center px-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-blue-500">{participants.filter(p => p.gender === '男').length}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">男性</div>
                      </div>
                      <div className="h-12 w-px bg-slate-200"></div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-rose-500">{participants.filter(p => p.gender === '女').length}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">女性</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {participants.filter(p => p.type === 'student').length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-4">学生部 学年別 内訳</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['小', '中', '高', '大'].map(gradePrefix => {
                        const count = participants.filter(p => p.type === 'student' && p.grade.startsWith(gradePrefix)).length;
                        const male = participants.filter(p => p.type === 'student' && p.grade.startsWith(gradePrefix) && p.gender === '男').length;
                        const female = participants.filter(p => p.type === 'student' && p.grade.startsWith(gradePrefix) && p.gender === '女').length;
                        return (
                          <div key={gradePrefix} className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                            <div className="font-bold text-slate-600 mb-2">{gradePrefix}学生</div>
                            <div className="text-2xl font-black text-slate-800 mb-2">{count} <span className="text-xs text-slate-400 font-bold">人</span></div>
                            <div className="flex justify-center gap-3 text-xs font-bold">
                              <span className="text-blue-500">男 {male}</span>
                              <span className="text-rose-500">女 {female}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {mode === 'manage' && (
              <div className="space-y-8">
                {/* Upload Section */}
                {role === 'admin' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student Upload */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-10"></div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <Users className="text-emerald-600"/> 学生部名簿の取り込み
                        </h3>
                        {data.timestamps?.rosterStudent && (
                          <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                            最終更新: {new Date(data.timestamps.rosterStudent).toLocaleString('ja-JP')}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
                        Excelファイルをアップロードすると、既存の学生部データは<span className="text-red-500 font-bold">上書き</span>されます。<br/>必ず最新のファイルを取り込んでください。
                      </p>
                      <label className="flex items-center justify-center w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-200">
                        <Upload size={18} className="mr-2"/> ファイルを選択
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e, 'student')} />
                      </label>
                    </div>
                    
                    {/* Youth Upload */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-amber-200 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10"></div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <Users className="text-amber-600"/> 青年部・一般名簿の取り込み
                        </h3>
                        {data.timestamps?.rosterYouth && (
                          <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                            最終更新: {new Date(data.timestamps.rosterYouth).toLocaleString('ja-JP')}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
                        Excelファイルをアップロードすると、既存の青年部・一般データは<span className="text-red-500 font-bold">上書き</span>されます。<br/>必ず最新のファイルを取り込んでください。
                      </p>
                      <label className="flex items-center justify-center w-full h-16 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-amber-200">
                        <Upload size={18} className="mr-2"/> ファイルを選択
                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e, 'youth')} />
                      </label>
                    </div>
                  </div>
                )}
                
                {/* Individual Edit Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-lg">参加者リスト（個別編集）</h3>
                    <div className="text-sm font-bold text-slate-500">{participants.length}名</div>
                  </div>
                  
                  {/* Duplicates Alert */}
                  {duplicates.length > 0 && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                      <h4 className="font-bold text-rose-700 flex items-center gap-2 mb-3">
                        <AlertCircle size={18}/> {duplicates.length}件の重複データが検出されました
                      </h4>
                      <div className="space-y-2">
                        {duplicates.map((group, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-rose-100">
                            <div>
                              <span className="font-bold text-slate-800">{group[0].name}</span>
                              <span className="text-xs text-slate-500 ml-2">({group.length}件のデータ)</span>
                            </div>
                            {role === 'admin' && (
                            <button onClick={() => handleMergeDuplicates(group)} className="text-sm font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-lg transition-colors">
                              統合する
                            </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search and Table */}
                  <div className="mb-4 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="名前で検索..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors"
                    />
                    {role === 'admin' && (
                    <button onClick={() => setEditingParticipant({id: 'new_'+Date.now(), type: 'student', name: '', gender: '男', grade: '小1', raw: {}, allocations: {}})} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl flex items-center gap-2 transition-colors">
                      <Plus size={18}/> 新規追加
                    </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm">
                          <th className="p-4 font-bold border-b border-slate-200">氏名</th>
                          <th className="p-4 font-bold border-b border-slate-200">所属</th>
                          <th className="p-4 font-bold border-b border-slate-200">学年/性別</th>
                          {role === 'admin' && <th className="p-4 font-bold border-b border-slate-200 w-24">操作</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {participants.filter(p => p.name.includes(searchQuery)).map(p => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-800">{p.name}</td>
                            <td className="p-4">
                              <span className={cn("px-2 py-1 rounded-md text-xs font-bold", p.type === 'student' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                                {p.type === 'student' ? '学生部' : '青年部・一般'}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-600 font-medium">{p.grade} / {p.gender}</td>
                            {role === 'admin' && (
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button onClick={() => setEditingParticipant(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                <button onClick={() => {
                                  if(confirm(p.name + ' を削除しますか？')) {
                                    updateParticipants(participants.filter(x => x.id !== p.id));
                                  }
                                }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                              </div>
                            </td>
                            )}
                          </tr>
                        ))}
                        {participants.filter(p => p.name.includes(searchQuery)).length === 0 && (
                          <tr>
                            <td colSpan={role === 'admin' ? 4 : 3} className="p-8 text-center text-slate-500 font-bold">該当する参加者が見つかりません</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {mode === 'export' && (
              <div className="space-y-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Download size={20} className="text-blue-600"/> 出力・絞り込み</h3>
                {role !== 'viewer' && role !== 'none' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => exportTemplateExcel(false)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-300 transition-all group text-left">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Download size={24}/>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">佛所護念会名簿 (全件)</h4>
                      <p className="text-xs text-slate-500">指定のフォーマットで全参加者の名簿を出力します。</p>
                    </button>
                    <button onClick={() => exportTemplateExcel(true)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-amber-300 transition-all group text-left">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <AlertCircle size={24}/>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">アレルギー対象者 絞り込み</h4>
                      <p className="text-xs text-slate-500">備考欄にアレルギー記載がある参加者のみを抽出して出力します。</p>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center text-slate-500 font-bold">
                    閲覧者権限ではデータのエクスポートはできません。
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
{/* LIFE GROUP MODE */}
        {mode === 'life' && (
          <div className="flex flex-col flex-1">
            {isEditing && (
              <div className="mb-4 flex gap-2">
                <button onClick={() => {
                  const current = d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}班` }));
                  updateLocal({...d, lifeGroups: [...current, { id: `life_new_${Date.now()}`, name: `${current.length + 1}班` }]});
                }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16}/> 1班追加</button>
                <button onClick={() => {
                  const current = d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}班` }));
                  if (current.length > 1) {
                    updateLocal({...d, lifeGroups: current.slice(0, current.length - 1)});
                  }
                }} className="bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Trash2 size={16}/> 1班減らす</button>
              </div>
            )}
            {renderBoard('group', d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}班` })), 'life')}
          </div>
        )}

        {/* STUDY GROUP MODE */}
        {mode === 'study' && (
          <div className="flex flex-col flex-1">
            {isEditing && (
              <div className="mb-4">
                <button onClick={() => setModal({isOpen: true, type: 'study', name: '', capacity: ''})} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-blue-200"><Plus size={16}/> 新しい班を作成</button>
              </div>
            )}
            {renderBoard('studyGroup', d.studyGroups || [])}
          </div>
        )}

        {/* ROOM MODE */}
        {mode === 'room' && (
          <div className="flex flex-col flex-1">
            {isEditing && (
              <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
                <div className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><AlertCircle size={16}/> 使用する宿泊棟を選択 (曾爾青少年自然の家)</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(facilitiesData).map(b => (
                    <label key={b} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-colors font-bold text-sm", (d.activeBuildings || []).includes(b) ? "bg-blue-50 border-blue-600 text-blue-800" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100")}>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={(d.activeBuildings || []).includes(b)}
                        onChange={(e) => {
                          let ab = [...(d.activeBuildings || [])];
                          if (e.target.checked) ab.push(b);
                          else ab = ab.filter(x => x !== b);
                          updateLocal({...d, activeBuildings: ab});
                        }}
                      />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {renderBoard('room', getActiveRooms(d), 'room')}
          </div>
        )}

        {/* CAR MODE */}
        {mode === 'car' && (
          <div className="flex flex-col flex-1">
            {isEditing && (
              <div className="mb-4">
                <button onClick={() => setModal({isOpen: true, type: 'car', name: '', capacity: ''})} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200"><Plus size={16}/> 車を追加</button>
              </div>
            )}
            {renderBoard('car', d.cars || [])}
          </div>
        )}

        {/* YOUTH ROLE MODE */}
        {mode === 'youthRole' && (
          <div className="flex flex-col flex-1">
            {isEditing && (
              <div className="mb-4">
                <button onClick={() => setModal({isOpen: true, type: 'youthRole', name: '', capacity: ''})} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200"><Plus size={16}/> カスタム役割を追加</button>
              </div>
            )}
            <div className="mb-4 text-sm font-bold text-slate-500 bg-slate-50 p-3 rounded-xl inline-block border border-slate-200">※ 行程表の主要役割と連動しています。枠の並べ替えも可能です。</div>
            {renderBoard('youthRole', d.youthRoles || [])}
          </div>
        )}

        {/* STUDENT ROLE MODE */}
        {mode === 'studentRole' && (
          <div className="flex flex-col flex-1">
            {isEditing && (
              <div className="mb-4">
                <button onClick={() => setModal({isOpen: true, type: 'studentRole', name: '', capacity: ''})} className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-purple-200"><Plus size={16}/> 役割を作成</button>
              </div>
            )}
            {renderBoard('studentRole', d.studentRoles || [])}
          </div>
        )}

      </div>

      {/* Custom Modal for Inputs */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-lg text-slate-800">
                  {modal.type === 'study' && '勉強会班の作成'}
                  {modal.type === 'car' && '配車（車）の追加'}
                  {modal.type === 'studentRole' && '学生部役割の作成'}
                </h3>
                <button onClick={() => setModal({...modal, isOpen: false})} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">名称</label>
                  <input 
                    type="text"
                    value={modal.name}
                    onChange={e => setModal({...modal, name: e.target.value})}
                    placeholder={modal.type==='study'?'例: 小学生班':modal.type==='car'?'例: 鈴木車':modal.type==='studentRole'?'例: レク担当':''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    autoFocus
                  />
                </div>
                {modal.type === 'car' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">定員 (任意)</label>
                    <input 
                      type="number"
                      value={modal.capacity}
                      onChange={e => setModal({...modal, capacity: e.target.value})}
                      placeholder="例: 4"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                )}
                
                <button 
                  onClick={submitModal}
                  disabled={!modal.name}
                  className="w-full bg-blue-600 disabled:bg-slate-300 text-white font-bold rounded-xl py-3 mt-4 transition-colors hover:bg-blue-700 shadow-md"
                >
                  追加する
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

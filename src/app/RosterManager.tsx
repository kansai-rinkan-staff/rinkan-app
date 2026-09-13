/* eslint-disable */
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
    toast.success('菫晏ｭ倥＠縺ｾ縺励◆');
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
      const norm = p.name.replace(/[\s縲]+/g, '');
      if(!nameMap.has(norm)) nameMap.set(norm, []);
      nameMap.get(norm)!.push(p);
    });
    return Array.from(nameMap.values()).filter(group => group.length > 1);
  };
  const duplicates = getDuplicates();

  const handleMergeDuplicates = (group: Participant[]) => {
    if(confirm(`${group[0].name} 縺・${group.length} 莉ｶ驥崎､・＠縺ｦ縺・∪縺吶・莉ｶ縺ｫ邨ｱ蜷医＠縺ｾ縺吶°・歔)) {
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
      toast.success('驥崎､・ｒ邨ｱ蜷医＠縺ｾ縺励◆');
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
          name: row['蜿ょ刈閠・ｰ丞錐'] || row['豌丞錐'] || '辟｡蜷・,
          gender: row['諤ｧ蛻･'] || '-',
          grade: row['蟄ｦ蟷ｴ'] || '-',
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
        toast.success(`${pType === 'student' ? '蟄ｦ逕滄Κ' : '髱貞ｹｴ驛ｨ'}縺ｮ繝・・繧ｿ繧・{newParticipants.length}莉ｶ蜿悶ｊ霎ｼ縺ｿ縺ｾ縺励◆`);
      } catch (err) {
        toast.error('Excel縺ｮ隱ｭ縺ｿ霎ｼ縺ｿ縺ｫ螟ｱ謨励＠縺ｾ縺励◆');
        console.error(err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const exportCurrentModeExcel = () => {
    if (participants.length === 0) {
      toast.error('繧ｨ繧ｯ繧ｹ繝昴・繝医☆繧九ョ繝ｼ繧ｿ縺後≠繧翫∪縺帙ｓ');
      return;
    }
    
    const d = isEditing ? localData : data;
    const lifeGroups = d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}迴ｭ` }));
    const studyGroups = d.studyGroups || [];
    const rooms = getActiveRooms(d);
    const cars = d.cars || [];
    const youthRoles = [
      {id:'菫晏▼', name:'菫晏▼'},{id:'縺願幻', name:'縺願幻'},{id:'逕滓ｴｻ', name:'逕滓ｴｻ'},
      {id:'鬟ｯ繝ｻ繧ｭ繝｣', name:'鬟ｯ繝ｻ繧ｭ繝｣'},{id:'隕句ｮ医ｊ', name:'隕句ｮ医ｊ'}
    ];
    const studentRoles = d.studentRoles || [];

    const getName = (list: any[], id?: string) => list.find(x => x.id === id)?.name || '';

    // Filter and map based on current mode
    let exportData: any[] = [];
    let sheetName = "";
    
    if (mode === 'life') {
      sheetName = "迴ｭ邱ｨ謌・;
      exportData = participants.filter(p => p.allocations.group).map(p => ({
        '蛹ｺ蛻・: p.type === 'student' ? '蟄ｦ逕滄Κ' : '髱貞ｹｴ驛ｨ繝ｻ荳闊ｬ',
        '豌丞錐': p.name,
        '諤ｧ蛻･': p.gender,
        '蟄ｦ蟷ｴ': p.grade,
        '迴ｭ': getName(lifeGroups, p.allocations.group),
        '蠖ｹ閨ｷ': p.allocations.groupRole === 'scarf' ? '繧ｹ繧ｫ繝ｼ繝・ : p.allocations.groupRole === 'leader' ? '迴ｭ髟ｷ' : '',
        '繧｢繝ｬ繝ｫ繧ｮ繝ｼ繝ｻ蛯呵・: p.raw['蛯呵・ｬ・] || p.raw['蛯呵・] || ''
      })).sort((a, b) => String(a['迴ｭ'] || '').localeCompare(String(b['迴ｭ'] || '')));
    } else if (mode === 'study') {
      sheetName = "蜍牙ｼｷ莨夂少";
      exportData = participants.filter(p => p.allocations.studyGroup).map(p => ({
        '豌丞錐': p.name,
        '諤ｧ蛻･': p.gender,
        '蟄ｦ蟷ｴ': p.grade,
        '蜍牙ｼｷ莨夂少': getName(studyGroups, p.allocations.studyGroup)
      })).sort((a, b) => String(a['蜍牙ｼｷ莨夂少'] || '').localeCompare(String(b['蜍牙ｼｷ莨夂少'] || '')));
    } else if (mode === 'room') {
      sheetName = "驛ｨ螻句牡";
      exportData = participants.filter(p => p.allocations.room).map(p => ({
        '豌丞錐': p.name,
        '諤ｧ蛻･': p.gender,
        '驛ｨ螻・: getName(rooms, p.allocations.room),
        '蠖ｹ閨ｷ': p.allocations.roomRole === 'room_leader' ? '螳､髟ｷ' : ''
      })).sort((a, b) => String(a['驛ｨ螻・] || '').localeCompare(String(b['驛ｨ螻・] || '')));
    } else if (mode === 'car') {
      sheetName = "驟崎ｻ・;
      exportData = participants.filter(p => p.allocations.car).map(p => ({
        '豌丞錐': p.name,
        '霆・: getName(cars, p.allocations.car)
      })).sort((a, b) => String(a['霆・] || '').localeCompare(String(b['霆・] || '')));
    } else if (mode === 'youthRole') {
      sheetName = "髱貞ｹｴ驛ｨ蠖ｹ蜑ｲ";
      exportData = participants.filter(p => p.type === 'youth' && p.allocations.youthRole).map(p => ({
        '豌丞錐': p.name,
        '蠖ｹ蜑ｲ': p.allocations.youthRole
      })).sort((a, b) => String(a['蠖ｹ蜑ｲ'] || '').localeCompare(String(b['蠖ｹ蜑ｲ'] || '')));
    } else if (mode === 'studentRole') {
      sheetName = "蟄ｦ逕滄Κ蠖ｹ蜑ｲ";
      exportData = participants.filter(p => p.type === 'student' && p.allocations.studentRole).map(p => ({
        '豌丞錐': p.name,
        '蠖ｹ蜑ｲ': getName(studentRoles, p.allocations.studentRole)
      })).sort((a, b) => String(a['蠖ｹ蜑ｲ'] || '').localeCompare(String(b['蠖ｹ蜑ｲ'] || '')));
    }

    if (exportData.length === 0) {
      toast.error('繧ｨ繧ｯ繧ｹ繝昴・繝医☆繧九ョ繝ｼ繧ｿ縺後≠繧翫∪縺帙ｓ・郁ｪｰ繧る・螻槭＆繧後※縺・∪縺帙ｓ・・);
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `譫鈴俣_${sheetName}.xlsx`);
  };

  const exportTemplateExcel = (onlyAllergy: boolean) => {
    if (participants.length === 0) {
      toast.error('繧ｨ繧ｯ繧ｹ繝昴・繝医☆繧九ョ繝ｼ繧ｿ縺後≠繧翫∪縺帙ｓ');
      return;
    }
    
    const d = isEditing ? localData : data;
    const lifeGroups = d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}迴ｭ` }));
    const rooms = getActiveRooms(d);
    const getName = (list: any[], id?: string) => list.find(x => x.id === id)?.name || '';

    let targetParticipants = participants;
    if (onlyAllergy) {
      targetParticipants = participants.filter(p => {
        const note = String(p.raw['蛯呵・ｬ・] || p.raw['蛯呵・] || '');
        return note.trim().length > 0;
      });
    }

    const exportData = targetParticipants.map((p, idx) => ({
      'No.': idx + 1,
      '縺ｵ繧翫′縺ｪ': p.raw['蜿ょ刈閠・ｰ丞錐・医ヵ繝ｪ繧ｬ繝奇ｼ・] || p.raw['豌丞錐・医ヵ繝ｪ繧ｬ繝奇ｼ・] || '',
      '豌丞錐': p.name,
      '諤ｧ蛻･': p.gender,
      '蟄ｦ蟷ｴ/蟷ｴ鮨｢': p.grade,
      '謇螻橸ｼ域髪驛ｨ・・: p.raw['謇螻樒ｳｻ邨ｱ繝ｻ謾ｯ驛ｨ蜷・] || '',
      '迴ｭ': getName(lifeGroups, p.allocations.group),
      '驛ｨ螻・: getName(rooms, p.allocations.room),
      '繧｢繝ｬ繝ｫ繧ｮ繝ｼ繝ｻ迚ｹ險倅ｺ矩・: p.raw['蛯呵・ｬ・] || p.raw['蛯呵・] || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "蛻ｩ逕ｨ閠・錐邁ｿ");
    XLSX.writeFile(wb, `菴帶園隴ｷ蠢ｵ莨喟蛻ｩ逕ｨ閠・錐邁ｿ${onlyAllergy ? '_繧｢繝ｬ繝ｫ繧ｮ繝ｼ遲・ : ''}.xlsx`);
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
         currentBuckets = Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}迴ｭ` }));
      }
      
      const sourceIdx = currentBuckets.findIndex(b => b.id === sourceBucketId);
      const targetIdx = currentBuckets.findIndex(b => b.id === targetBucketId);
      if (sourceIdx === -1 || targetIdx === -1) return;
      
      const [moved] = currentBuckets.splice(sourceIdx, 1);
      currentBuckets.splice(targetIdx, 0, moved);
      
      if (allocationKey === 'group') {
        currentBuckets.forEach((b, idx) => {
          b.name = `${idx + 1}迴ｭ`;
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
          // r.floor might be mojibake or real text (e.g. "1髫・), we just show it safely
          const floorStr = r.floor ? `${r.floor.replace(/[^0-9]/g, '')}髫餐 : '';
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
            <span className="text-sm uppercase tracking-wider">譛ｪ驟榊ｱ槭Μ繧ｹ繝・/span>
            <span className="bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{unassigned.length}蜷・/span>
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
                  <div className="text-[10px] text-slate-400 font-medium">{p.gender} / {p.grade} / {p.type === 'student' ? '蟄ｦ逕・ : '髱貞ｹｴ'}</div>
                </div>
              </div>
            ))}
            {unassigned.length === 0 && <div className="text-slate-400 text-xs text-center pt-8">蜈ｨ蜩｡驟榊ｱ樊ｸ医∩縺ｧ縺・/div>}
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
                  <span>{assigned.length}蜷・/span>
                  {bucket.capacity && (
                    <span className={cn(isOverCapacity ? "text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded" : "")}>螳壼藤: {bucket.capacity}蜷・/span>
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
                          <button onClick={() => toggleRole(p.id, 'groupRole', 'scarf')} className={cn("text-[10px] px-2 py-1 rounded-md border transition-colors font-bold", p.allocations.groupRole === 'scarf' ? "bg-blue-500 border-blue-600 text-white shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100")}>繧ｹ繧ｫ繝ｼ繝・/button>
                          <button onClick={() => toggleRole(p.id, 'groupRole', 'leader')} className={cn("text-[10px] px-2 py-1 rounded-md border transition-colors font-bold", p.allocations.groupRole === 'leader' ? "bg-amber-500 border-amber-600 text-white shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100")}>迴ｭ髟ｷ</button>
                        </div>
                      )}
                      
                      {allowRoleToggles === 'room' && role === 'admin' && isEditing && (
                        <div className="mt-2 flex gap-1">
                          <button onClick={() => toggleRole(p.id, 'roomRole', 'room_leader')} className={cn("text-[10px] px-2 py-1 rounded-md border transition-colors font-bold", p.allocations.roomRole === 'room_leader' ? "bg-purple-500 border-purple-600 text-white shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100")}>螳､髟ｷ</button>
                        </div>
                      )}
                      
                      {/* Readonly badges */}
                      {(!isEditing || role !== 'admin') && p.allocations.groupRole === 'scarf' && <div className="mt-1.5 text-[10px] font-bold text-white bg-blue-500 inline-block px-2 py-0.5 rounded-md">繧ｹ繧ｫ繝ｼ繝・/div>}
                      {(!isEditing || role !== 'admin') && p.allocations.groupRole === 'leader' && <div className="mt-1.5 text-[10px] font-bold text-white bg-amber-500 inline-block px-2 py-0.5 rounded-md">迴ｭ髟ｷ</div>}
                      {(!isEditing || role !== 'admin') && p.allocations.roomRole === 'room_leader' && <div className="mt-1.5 text-[10px] font-bold text-white bg-purple-500 inline-block px-2 py-0.5 rounded-md">螳､髟ｷ</div>}
                    </div>
                  ))}
                  {assigned.length === 0 && <div className="text-slate-400 text-xs text-center pt-4">繝峨Λ繝・げ縺励※霑ｽ蜉</div>}
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
    if (mode === 'life') return '迴ｭ';
    if (mode === 'study') return '蜍牙ｼｷ莨夂少';
    if (mode === 'room') return '驛ｨ螻句牡';
    if (mode === 'car') return '驟崎ｻ・;
    if (mode === 'youthRole') return '髱貞ｹｴ驛ｨ蠖ｹ蜑ｲ';
    if (mode === 'studentRole') return '蟄ｦ逕滄Κ蠖ｹ蜑ｲ';
    return '';
  };

  const renderTabs = () => {
    const modes = category === 'roster'
      ? [{id: 'dashboard', label: '繝繝・す繝･繝懊・繝・}, {id: 'manage', label: '蜷咲ｰｿ邂｡逅・}, {id: 'export', label: '蜃ｺ蜉帙・邨槭ｊ霎ｼ縺ｿ'}]
      : category === 'groups' 
      ? [{id: 'life', label: '迴ｭ'}, {id: 'study', label: '蜍牙ｼｷ莨夂少'}, {id: 'room', label: '驛ｨ螻句牡'}]
      : [{id: 'car', label: '驟崎ｻ・}, {id: 'youthRole', label: '髱貞ｹｴ驛ｨ蠖ｹ蜑ｲ'}, {id: 'studentRole', label: '蟄ｦ逕滄Κ蠖ｹ蜑ｲ'}];

    return (
      <div className="flex gap-2 pb-4 pt-2 -mx-2 px-2 overflow-x-auto hide-scrollbar">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => {
              if (isEditing) {
                if(confirm('邱ｨ髮・ｸｭ縺ｮ蜀・ｮｹ縺ｯ遐ｴ譽・＆繧後∪縺吶ゅｈ繧阪＠縺・〒縺吶°・・)) {
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
                <Download size={16}/> {getModeLabel()} 繧ｨ繧ｯ繧ｻ繝ｫ蜃ｺ蜉・              </button>
            )}
            
            {role === 'admin' && (
              <>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-sm">
                    <Edit2 size={16}/> 邱ｨ髮・                  </button>
                ) : (
                  <>
                    <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                      <Save size={16}/> 菫晏ｭ・                    </button>
                    <button onClick={() => {setIsEditing(false); setLocalData(data);}} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors">
                      繧ｭ繝｣繝ｳ繧ｻ繝ｫ
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
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Users size={20} className="text-blue-600"/> 蜿ょ刈閠・ム繝・す繝･繝懊・繝・/h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                    <div className="text-slate-500 font-bold mb-2">邱丞盾蜉莠ｺ謨ｰ</div>
                    <div className="text-5xl font-black text-blue-600">{participants.length} <span className="text-lg text-slate-400">莠ｺ</span></div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-slate-500 font-bold mb-4 text-center">謇螻槫挨 蜀・ｨｳ</div>
                    <div className="flex justify-between items-center px-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-emerald-600">{participants.filter(p => p.type === 'student').length}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">蟄ｦ逕滄Κ</div>
                      </div>
                      <div className="h-12 w-px bg-slate-200"></div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-amber-600">{participants.filter(p => p.type === 'youth').length}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">髱貞ｹｴ驛ｨ繝ｻ荳闊ｬ</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-slate-500 font-bold mb-4 text-center">逕ｷ螂ｳ豈・(蜈ｨ菴・</div>
                    <div className="flex justify-between items-center px-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-blue-500">{participants.filter(p => p.gender === '逕ｷ').length}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">逕ｷ諤ｧ</div>
                      </div>
                      <div className="h-12 w-px bg-slate-200"></div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-rose-500">{participants.filter(p => p.gender === '螂ｳ').length}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1">螂ｳ諤ｧ</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {participants.filter(p => p.type === 'student').length > 0 && (
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-700 mb-4">蟄ｦ逕滄Κ 蟄ｦ蟷ｴ蛻･ 蜀・ｨｳ</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['蟆・, '荳ｭ', '鬮・, '螟ｧ'].map(gradePrefix => {
                        const count = participants.filter(p => p.type === 'student' && p.grade.startsWith(gradePrefix)).length;
                        const male = participants.filter(p => p.type === 'student' && p.grade.startsWith(gradePrefix) && p.gender === '逕ｷ').length;
                        const female = participants.filter(p => p.type === 'student' && p.grade.startsWith(gradePrefix) && p.gender === '螂ｳ').length;
                        return (
                          <div key={gradePrefix} className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                            <div className="font-bold text-slate-600 mb-2">{gradePrefix}蟄ｦ逕・/div>
                            <div className="text-2xl font-black text-slate-800 mb-2">{count} <span className="text-xs text-slate-400 font-bold">莠ｺ</span></div>
                            <div className="flex justify-center gap-3 text-xs font-bold">
                              <span className="text-blue-500">逕ｷ {male}</span>
                              <span className="text-rose-500">螂ｳ {female}</span>
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
                          <Users className="text-emerald-600"/> 蟄ｦ逕滄Κ蜷咲ｰｿ縺ｮ蜿悶ｊ霎ｼ縺ｿ
                        </h3>
                        {data.timestamps?.rosterStudent && (
                          <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                            譛邨よ峩譁ｰ: {new Date(data.timestamps.rosterStudent).toLocaleString('ja-JP')}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
                        Excel繝輔ぃ繧､繝ｫ繧偵い繝・・繝ｭ繝ｼ繝峨☆繧九→縲∵里蟄倥・蟄ｦ逕滄Κ繝・・繧ｿ縺ｯ<span className="text-red-500 font-bold">荳頑嶌縺・/span>縺輔ｌ縺ｾ縺吶・br/>蠢・★譛譁ｰ縺ｮ繝輔ぃ繧､繝ｫ繧貞叙繧願ｾｼ繧薙〒縺上□縺輔＞縲・                      </p>
                      <label className="flex items-center justify-center w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-emerald-200">
                        <Upload size={18} className="mr-2"/> 繝輔ぃ繧､繝ｫ繧帝∈謚・                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e, 'student')} />
                      </label>
                    </div>
                    
                    {/* Youth Upload */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-amber-200 transition-colors">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10"></div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                          <Users className="text-amber-600"/> 髱貞ｹｴ驛ｨ繝ｻ荳闊ｬ蜷咲ｰｿ縺ｮ蜿悶ｊ霎ｼ縺ｿ
                        </h3>
                        {data.timestamps?.rosterYouth && (
                          <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                            譛邨よ峩譁ｰ: {new Date(data.timestamps.rosterYouth).toLocaleString('ja-JP')}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">
                        Excel繝輔ぃ繧､繝ｫ繧偵い繝・・繝ｭ繝ｼ繝峨☆繧九→縲∵里蟄倥・髱貞ｹｴ驛ｨ繝ｻ荳闊ｬ繝・・繧ｿ縺ｯ<span className="text-red-500 font-bold">荳頑嶌縺・/span>縺輔ｌ縺ｾ縺吶・br/>蠢・★譛譁ｰ縺ｮ繝輔ぃ繧､繝ｫ繧貞叙繧願ｾｼ繧薙〒縺上□縺輔＞縲・                      </p>
                      <label className="flex items-center justify-center w-full h-16 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-md shadow-amber-200">
                        <Upload size={18} className="mr-2"/> 繝輔ぃ繧､繝ｫ繧帝∈謚・                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={(e) => handleFileUpload(e, 'youth')} />
                      </label>
                    </div>
                  </div>
                )}
                
                {/* Individual Edit Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 text-lg">蜿ょ刈閠・Μ繧ｹ繝茨ｼ亥句挨邱ｨ髮・ｼ・/h3>
                    <div className="text-sm font-bold text-slate-500">{participants.length}蜷・/div>
                  </div>
                  
                  {/* Duplicates Alert */}
                  {duplicates.length > 0 && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                      <h4 className="font-bold text-rose-700 flex items-center gap-2 mb-3">
                        <AlertCircle size={18}/> {duplicates.length}莉ｶ縺ｮ驥崎､・ョ繝ｼ繧ｿ縺梧､懷・縺輔ｌ縺ｾ縺励◆
                      </h4>
                      <div className="space-y-2">
                        {duplicates.map((group, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-rose-100">
                            <div>
                              <span className="font-bold text-slate-800">{group[0].name}</span>
                              <span className="text-xs text-slate-500 ml-2">({group.length}莉ｶ縺ｮ繝・・繧ｿ)</span>
                            </div>
                            {role === 'admin' && (
                            <button onClick={() => handleMergeDuplicates(group)} className="text-sm font-bold bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-lg transition-colors">
                              邨ｱ蜷医☆繧・                            </button>
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
                      placeholder="蜷榊燕縺ｧ讀懃ｴ｢..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 transition-colors"
                    />
                    {role === 'admin' && (
                    <button onClick={() => setEditingParticipant({id: 'new_'+Date.now(), type: 'student', name: '', gender: '逕ｷ', grade: '蟆・', raw: {}, allocations: {}})} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-xl flex items-center gap-2 transition-colors">
                      <Plus size={18}/> 譁ｰ隕剰ｿｽ蜉
                    </button>
                    )}
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 text-sm">
                          <th className="p-4 font-bold border-b border-slate-200">豌丞錐</th>
                          <th className="p-4 font-bold border-b border-slate-200">謇螻・/th>
                          <th className="p-4 font-bold border-b border-slate-200">蟄ｦ蟷ｴ/諤ｧ蛻･</th>
                          {role === 'admin' && <th className="p-4 font-bold border-b border-slate-200 w-24">謫堺ｽ・/th>}
                        </tr>
                      </thead>
                      <tbody>
                        {participants.filter(p => p.name.includes(searchQuery)).map(p => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-800">{p.name}</td>
                            <td className="p-4">
                              <span className={cn("px-2 py-1 rounded-md text-xs font-bold", p.type === 'student' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                                {p.type === 'student' ? '蟄ｦ逕滄Κ' : '髱貞ｹｴ驛ｨ繝ｻ荳闊ｬ'}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-slate-600 font-medium">{p.grade} / {p.gender}</td>
                            {role === 'admin' && (
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button onClick={() => setEditingParticipant(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                <button onClick={() => {
                                  if(confirm(p.name + ' 繧貞炎髯､縺励∪縺吶°・・)) {
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
                            <td colSpan={role === 'admin' ? 4 : 3} className="p-8 text-center text-slate-500 font-bold">隧ｲ蠖薙☆繧句盾蜉閠・′隕九▽縺九ｊ縺ｾ縺帙ｓ</td>
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
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><Download size={20} className="text-blue-600"/> 蜃ｺ蜉帙・邨槭ｊ霎ｼ縺ｿ</h3>
                {role !== 'viewer' && role !== 'none' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => exportTemplateExcel(false)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-300 transition-all group text-left">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Download size={24}/>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">菴帶園隴ｷ蠢ｵ莨壼錐邁ｿ (蜈ｨ莉ｶ)</h4>
                      <p className="text-xs text-slate-500">謖・ｮ壹・繝輔か繝ｼ繝槭ャ繝医〒蜈ｨ蜿ょ刈閠・・蜷咲ｰｿ繧貞・蜉帙＠縺ｾ縺吶・/p>
                    </button>
                    <button onClick={() => exportTemplateExcel(true)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-amber-300 transition-all group text-left">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <AlertCircle size={24}/>
                      </div>
                      <h4 className="font-bold text-slate-800 mb-1">繧｢繝ｬ繝ｫ繧ｮ繝ｼ蟇ｾ雎｡閠・邨槭ｊ霎ｼ縺ｿ</h4>
                      <p className="text-xs text-slate-500">蛯呵・ｬ・↓繧｢繝ｬ繝ｫ繧ｮ繝ｼ險倩ｼ峨′縺ゅｋ蜿ょ刈閠・・縺ｿ繧呈歓蜃ｺ縺励※蜃ｺ蜉帙＠縺ｾ縺吶・/p>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center text-slate-500 font-bold">
                    髢ｲ隕ｧ閠・ｨｩ髯舌〒縺ｯ繝・・繧ｿ縺ｮ繧ｨ繧ｯ繧ｹ繝昴・繝医・縺ｧ縺阪∪縺帙ｓ縲・                  </div>
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
                  const current = d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}迴ｭ` }));
                  updateLocal({...d, lifeGroups: [...current, { id: `life_new_${Date.now()}`, name: `${current.length + 1}迴ｭ` }]});
                }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16}/> 1迴ｭ霑ｽ蜉</button>
                <button onClick={() => {
                  const current = d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}迴ｭ` }));
                  if (current.length > 1) {
                    updateLocal({...d, lifeGroups: current.slice(0, current.length - 1)});
                  }
                }} className="bg-slate-100 hover:bg-red-100 hover:text-red-700 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"><Trash2 size={16}/> 1迴ｭ貂帙ｉ縺・/button>
              </div>
            )}
            {renderBoard('group', d.lifeGroups || Array.from({length: 6}, (_, i) => ({ id: `life_${i+1}`, name: `${i+1}迴ｭ` })), 'life')}
          </div>
        )}

        {/* STUDY GROUP MODE */}
        {mode === 'study' && (
          <div className="flex flex-col flex-1">
            {isEditing && (
              <div className="mb-4">
                <button onClick={() => setModal({isOpen: true, type: 'study', name: '', capacity: ''})} className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-blue-200"><Plus size={16}/> 譁ｰ縺励＞迴ｭ繧剃ｽ懈・</button>
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
                <div className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2"><AlertCircle size={16}/> 菴ｿ逕ｨ縺吶ｋ螳ｿ豕頑｣溘ｒ驕ｸ謚・(譖ｾ辷ｾ髱貞ｰ大ｹｴ閾ｪ辟ｶ縺ｮ螳ｶ)</div>
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
                <button onClick={() => setModal({isOpen: true, type: 'car', name: '', capacity: ''})} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200"><Plus size={16}/> 霆翫ｒ霑ｽ蜉</button>
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
                <button onClick={() => setModal({isOpen: true, type: 'youthRole', name: '', capacity: ''})} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-200"><Plus size={16}/> 繧ｫ繧ｹ繧ｿ繝蠖ｹ蜑ｲ繧定ｿｽ蜉</button>
              </div>
            )}
            <div className="mb-4 text-sm font-bold text-slate-500 bg-slate-50 p-3 rounded-xl inline-block border border-slate-200">窶ｻ 陦檎ｨ玖｡ｨ縺ｮ荳ｻ隕∝ｽｹ蜑ｲ縺ｨ騾｣蜍輔＠縺ｦ縺・∪縺吶よ棧縺ｮ荳ｦ縺ｹ譖ｿ縺医ｂ蜿ｯ閭ｽ縺ｧ縺吶・/div>
            {renderBoard('youthRole', d.youthRoles || [])}
          </div>
        )}

        {/* STUDENT ROLE MODE */}
        {mode === 'studentRole' && (
          <div className="flex flex-col flex-1">
            {isEditing && (
              <div className="mb-4">
                <button onClick={() => setModal({isOpen: true, type: 'studentRole', name: '', capacity: ''})} className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-purple-200"><Plus size={16}/> 蠖ｹ蜑ｲ繧剃ｽ懈・</button>
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
                  {modal.type === 'study' && '蜍牙ｼｷ莨夂少縺ｮ菴懈・'}
                  {modal.type === 'car' && '驟崎ｻ奇ｼ郁ｻ奇ｼ峨・霑ｽ蜉'}
                  {modal.type === 'studentRole' && '蟄ｦ逕滄Κ蠖ｹ蜑ｲ縺ｮ菴懈・'}
                </h3>
                <button onClick={() => setModal({...modal, isOpen: false})} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">蜷咲ｧｰ</label>
                  <input 
                    type="text"
                    value={modal.name}
                    onChange={e => setModal({...modal, name: e.target.value})}
                    placeholder={modal.type==='study'?'萓・ 蟆丞ｭｦ逕溽少':modal.type==='car'?'萓・ 驤ｴ譛ｨ霆・:modal.type==='studentRole'?'萓・ 繝ｬ繧ｯ諡・ｽ・:''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    autoFocus
                  />
                </div>
                {modal.type === 'car' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">螳壼藤 (莉ｻ諢・</label>
                    <input 
                      type="number"
                      value={modal.capacity}
                      onChange={e => setModal({...modal, capacity: e.target.value})}
                      placeholder="萓・ 4"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                )}
                
                <button 
                  onClick={submitModal}
                  disabled={!modal.name}
                  className="w-full bg-blue-600 disabled:bg-slate-300 text-white font-bold rounded-xl py-3 mt-4 transition-colors hover:bg-blue-700 shadow-md"
                >
                  霑ｽ蜉縺吶ｋ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


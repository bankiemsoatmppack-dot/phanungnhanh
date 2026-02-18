
import React, { useState, useEffect } from 'react';
import { DriveSlot } from '../types';
import { initializeSystemSlot } from '../services/storageService';
import { Server, CheckCircle, RefreshCw, AlertCircle, Loader2, Cloud, FileSpreadsheet, Folder, ExternalLink, Link, Database, Power, AlertTriangle, Plus } from 'lucide-react';

const Settings: React.FC = () => {
  // Initial Mock Data or Load from LocalStorage
  const [slots, setSlots] = useState<DriveSlot[]>(() => {
    try {
        const saved = localStorage.getItem('storage_slots');
        if (saved) return JSON.parse(saved);
    } catch (error) {
        console.error("Failed to load settings", error);
    }
    // Default Slots
    return Array.from({ length: 4 }).map((_, i) => ({
      id: i + 1,
      name: `Kho Dữ Liệu ${i + 1}`,
      driveFolderLink: '',
      driveFolderId: '',
      sheetId: '',
      totalCapacityBytes: 15 * 1024 * 1024 * 1024, // 15GB
      usedBytes: 0,
      isConnected: false,
      status: 'ready',
      isInitialized: false
    }));
  });

  const [initializingId, setInitializingId] = useState<number | null>(null);

  // Sync to local storage whenever slots change
  useEffect(() => {
      localStorage.setItem('storage_slots', JSON.stringify(slots));
  }, [slots]);

  const handleSlotNameChange = (id: number, value: string) => {
    setSlots(slots.map(slot => slot.id === id ? { ...slot, name: value } : slot));
  };

  const handleDriveLinkChange = (id: number, value: string) => {
    setSlots(slots.map(slot => slot.id === id ? { ...slot, driveFolderLink: value } : slot));
  };

  // Toggle Connection State (Multi-Active allowed)
  const toggleConnection = (id: number) => {
    setSlots(prev => prev.map(slot => {
        if (slot.id === id) {
            if (!slot.isInitialized && !slot.isConnected) {
                alert("Vui lòng khởi tạo kết nối (Tự động tạo Sheet) trước khi bật!");
                return slot;
            }
            return { ...slot, isConnected: !slot.isConnected };
        }
        return slot;
    }));
  };

  const handleInitialize = async (id: number, driveLink?: string) => {
      if (!driveLink) {
          alert("Vui lòng dán Link Folder Google Drive trước!");
          return;
      }

      setInitializingId(id);
      try {
          const result = await initializeSystemSlot(id, driveLink);
          setSlots(prev => prev.map(slot => {
              if (slot.id === id) {
                  return {
                      ...slot,
                      ...result,
                      isConnected: true, // Auto turn on
                      status: 'ready'
                  };
              }
              return slot;
          }));
      } catch (e: any) {
          alert("Lỗi: " + (e.message || "Không thể kết nối"));
      } finally {
          setInitializingId(null);
      }
  };

  // ADD NEW SLOT FUNCTION
  const handleAddSlot = () => {
      const newId = (slots.length > 0 ? Math.max(...slots.map(s => s.id)) : 0) + 1;
      const newSlot: DriveSlot = {
          id: newId,
          name: `Kho Dữ Liệu ${newId}`,
          driveFolderLink: '',
          driveFolderId: '',
          sheetId: '',
          totalCapacityBytes: 15 * 1024 * 1024 * 1024, // 15GB
          usedBytes: 0,
          isConnected: false,
          status: 'ready',
          isInitialized: false
      };
      setSlots([...slots, newSlot]);
      // Scroll to bottom logic could be added here
      alert(`Đã thêm Kho Dữ Liệu #${newId} thành công.`);
  };

  // Helper to format bytes
  const formatSize = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Server size={28} className="text-blue-600"/> Quản trị Hệ thống Đa Kho
                </h2>
                <p className="text-gray-500 mt-1">Kết nối nhiều tài khoản Google Drive để mở rộng dung lượng lưu trữ.</p>
            </div>
            <div className="flex gap-4">
                 <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                     <span className="font-bold text-gray-700 block">Tổng kho</span>
                     <span className="text-blue-600 font-mono text-lg">{slots.length}</span>
                 </div>
                 <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm">
                     <span className="font-bold text-gray-700 block">Đang kết nối</span>
                     <span className="text-green-600 font-mono text-lg">{slots.filter(s => s.isConnected).length}</span>
                 </div>
            </div>
        </div>

        {/* Info Box - Updated for Safe Threshold */}
        <div className="bg-blue-50 text-blue-900 p-4 rounded-xl border border-blue-100 mb-6 flex gap-4 shadow-sm items-start">
             <div className="bg-blue-200 p-2 rounded-lg h-fit text-blue-700">
                <Database size={24} />
             </div>
             <div>
                <h4 className="font-bold text-sm mb-1 uppercase">Cơ chế Định tuyến & Cân bằng tải:</h4>
                <p className="text-sm mb-1">
                    Hệ thống sẽ <strong>tự động điều chuyển</strong> hồ sơ mới vào Kho có trạng thái "ĐANG KẾT NỐI" và dung lượng dưới ngưỡng an toàn (11GB).
                </p>
                <ul className="list-disc list-inside text-xs space-y-1 opacity-80">
                    <li>Ngưỡng an toàn: <strong>11GB</strong>. Phần còn lại (4GB) dùng để dự phòng cập nhật dữ liệu cho các hồ sơ cũ.</li>
                    <li>Khi một kho đầy (đạt 11GB), hệ thống sẽ tự tìm kho tiếp theo. Bạn có thể tự thêm kho mới bất kỳ lúc nào.</li>
                </ul>
             </div>
        </div>

        {/* Slots Grid */}
        <div className="grid grid-cols-1 gap-6 pb-20">
            {slots.map((slot) => {
                const percentUsed = (slot.usedBytes / slot.totalCapacityBytes) * 100;
                // Safe limit is ~73% (11/15)
                const safePercent = (11 / 15) * 100; 
                const isOverSafeLimit = slot.usedBytes >= (11 * 1024 * 1024 * 1024);
                const isFull = percentUsed >= 95;
                
                return (
                    <div key={slot.id} className={`relative flex flex-col md:flex-row gap-6 p-6 rounded-2xl border-2 transition-all ${
                        slot.isConnected 
                            ? 'border-green-500 bg-white shadow-lg ring-4 ring-green-50/50' 
                            : 'border-gray-200 bg-gray-50 opacity-80 hover:opacity-100'
                    }`}>
                        {/* Status Badge Absolute */}
                        <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 ${
                             slot.isConnected ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                        }`}>
                             <Power size={12} /> {slot.isConnected ? 'ĐANG KẾT NỐI' : 'NGẮT KẾT NỐI'}
                        </div>

                        {/* LEFT: ID & BASIC INFO */}
                        <div className="w-full md:w-1/3 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md ${
                                    slot.isConnected ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gray-400'
                                }`}>
                                    #{slot.id}
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tên Kho / Tài khoản</label>
                                    <input 
                                        type="text" 
                                        value={slot.name}
                                        onChange={(e) => handleSlotNameChange(slot.id, e.target.value)}
                                        className="font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 outline-none w-full text-lg"
                                    />
                                </div>
                            </div>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg mt-auto">
                                <span className="text-sm font-semibold text-gray-600">Trạng thái hoạt động</span>
                                <button 
                                    onClick={() => toggleConnection(slot.id)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${
                                        slot.isConnected ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                                >
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                                        slot.isConnected ? 'translate-x-6' : 'translate-x-0'
                                    }`}></div>
                                </button>
                            </div>
                        </div>

                        {/* CENTER: STORAGE & CAPACITY */}
                        <div className="w-full md:w-1/3 flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block mb-2 flex justify-between">
                                    <span>Dung lượng lưu trữ</span>
                                    <span className={`${isFull ? 'text-red-600' : (isOverSafeLimit ? 'text-orange-500' : 'text-blue-600')}`}>
                                        {percentUsed.toFixed(1)}%
                                    </span>
                                </label>
                                <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner relative">
                                    {/* Safe Limit Marker (11GB) */}
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10" style={{left: `${safePercent}%`}} title="Ngưỡng an toàn 11GB"></div>
                                    
                                    <div 
                                        className={`h-full transition-all duration-1000 ${
                                            isFull 
                                                ? 'bg-red-500' 
                                                : (isOverSafeLimit ? 'bg-gradient-to-r from-blue-500 to-orange-400' : 'bg-gradient-to-r from-blue-400 to-blue-600')
                                        }`} 
                                        style={{ width: `${percentUsed}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                                    <span>Đã dùng: {formatSize(slot.usedBytes)}</span>
                                    <span>Tổng: {formatSize(slot.totalCapacityBytes)} (15GB)</span>
                                </div>
                                
                                {/* Warning Text */}
                                {isOverSafeLimit && !isFull && (
                                    <div className="mt-2 text-xs text-orange-600 flex items-center gap-1 bg-orange-50 p-1.5 rounded border border-orange-100">
                                        <AlertTriangle size={12} /> Kho đã qua mức an toàn (11GB). Chỉ dùng để cập nhật hồ sơ cũ.
                                    </div>
                                )}
                            </div>

                            {/* System Info if Initialized */}
                            {slot.isInitialized ? (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-xs space-y-2 mt-auto">
                                    <div className="flex justify-between items-center">
                                         <span className="font-semibold text-green-800 flex items-center gap-1">
                                             <FileSpreadsheet size={12}/> Google Sheet
                                         </span>
                                         <span className="font-mono text-gray-600 bg-white px-1 rounded border">...{slot.sheetId.slice(-6)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                         <span className="font-semibold text-green-800 flex items-center gap-1">
                                             <Folder size={12}/> Folder ID
                                         </span>
                                         <span className="font-mono text-gray-600 bg-white px-1 rounded border">...{slot.driveFolderId.slice(-6)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-700 italic mt-auto flex items-center gap-2">
                                    <AlertCircle size={14}/> Chưa khởi tạo dữ liệu
                                </div>
                            )}
                        </div>

                        {/* RIGHT: CONFIG & ACTIONS */}
                        <div className="w-full md:w-1/3 flex flex-col gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                                    Link Folder Google Drive (Chứa Ảnh)
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={slot.driveFolderLink || ''}
                                        onChange={(e) => handleDriveLinkChange(slot.id, e.target.value)}
                                        disabled={slot.isInitialized}
                                        placeholder="https://drive.google.com/..."
                                        className={`w-full border rounded px-3 py-2 text-xs outline-none focus:border-blue-500 ${slot.isInitialized ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
                                    />
                                    {slot.isInitialized && (
                                        <a href={slot.driveFolderLink} target="_blank" rel="noreferrer" className="bg-white border border-gray-300 px-2 rounded flex items-center justify-center hover:bg-gray-50 text-blue-600">
                                            <ExternalLink size={14}/>
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto">
                                {!slot.isInitialized ? (
                                    <button 
                                        onClick={() => handleInitialize(slot.id, slot.driveFolderLink)}
                                        disabled={initializingId === slot.id || !slot.driveFolderLink}
                                        className={`w-full py-3 rounded-lg text-xs font-bold shadow flex items-center justify-center gap-2 transition-all ${
                                            !slot.driveFolderLink 
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {initializingId === slot.id ? <Loader2 size={14} className="animate-spin"/> : <Link size={14}/>}
                                        Tự động tạo Sheet & Kết nối
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            if(window.confirm("Cảnh báo: Hủy kết nối sẽ buộc bạn phải thiết lập lại từ đầu cho kho này. Dữ liệu cũ trên Drive không bị mất. Tiếp tục?")) {
                                                setSlots(prev => prev.map(s => s.id === slot.id ? {...s, isInitialized: false, isConnected: false, sheetId: '', driveFolderId: '', usedBytes: 0} : s));
                                            }
                                        }}
                                        className="w-full py-2 border border-red-200 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                                    >
                                        Reset / Hủy cấu hình
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* ADD NEW SLOT BUTTON */}
            <button 
                onClick={handleAddSlot}
                className="w-full py-6 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-3 text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
                <div className="bg-gray-100 p-2 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Plus size={24} />
                </div>
                <span className="font-bold text-lg">Thêm Kho Lưu Trữ Mới</span>
            </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;


import React, { useState, useEffect } from 'react';
import { StorageConfig, DriveSlot } from '../types';
import { Save, Server, Database, AlertCircle, CheckCircle, RefreshCw, Plus } from 'lucide-react';

const Settings: React.FC = () => {
  // Initial Mock Data or Load from LocalStorage
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  
  const [slots, setSlots] = useState<DriveSlot[]>(() => {
    // Try to load from local storage or default to 10 empty slots
    const saved = localStorage.getItem('storage_slots');
    if (saved) return JSON.parse(saved);

    return Array.from({ length: 10 }).map((_, i) => ({
      id: i + 1,
      name: `Kho lưu trữ ${i + 1}`,
      driveFolderId: '',
      sheetId: '',
      capacityUsed: Math.floor(Math.random() * 20), // Mock initial random usage
      isActive: i === 0, // First one active by default
      status: i === 0 ? 'active' : 'ready'
    }));
  });

  const handleSlotChange = (id: number, field: keyof DriveSlot, value: string) => {
    setSlots(slots.map(slot => slot.id === id ? { ...slot, [field]: value } : slot));
  };

  const handleSetActive = (id: number) => {
    setSlots(slots.map(slot => ({
      ...slot,
      isActive: slot.id === id,
      status: slot.id === id ? 'active' : (slot.status === 'full' ? 'full' : 'ready')
    })));
  };

  const handleSave = () => {
    localStorage.setItem('storage_slots', JSON.stringify(slots));
    // In a real app, you would verify API keys here
    alert('Đã lưu cấu hình kết nối Google Drive & Sheets thành công!');
  };

  const getStatusColor = (slot: DriveSlot) => {
     if (slot.isActive) return 'bg-green-50 border-green-200';
     if (slot.status === 'full') return 'bg-red-50 border-red-200';
     return 'bg-white border-gray-200';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Server size={28} className="text-blue-600"/> Cấu hình Lưu trữ Đám mây
                </h2>
                <p className="text-gray-500 mt-1">Quản lý kết nối Google Drive và Google Sheets để tối ưu hóa dung lượng.</p>
            </div>
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 font-bold"
            >
                <Save size={20} /> Lưu Cấu Hình
            </button>
        </div>

        {/* Global API Config */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Database size={20} /> Google Cloud API Project
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Google Client ID</label>
                    <input 
                        type="text" 
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="xxxxx.apps.googleusercontent.com"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Google API Key</label>
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy....."
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>
            <div className="mt-4 bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>
                    Hệ thống sẽ sử dụng API Key này để xác thực. Vui lòng đảm bảo Project trên Google Cloud Console đã bật <strong>Google Drive API</strong> và <strong>Google Sheets API</strong>.
                </span>
            </div>
        </div>

        {/* Slots Configuration */}
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <RefreshCw size={20} /> Danh sách Kho lưu trữ (Tự động luân chuyển)
        </h3>
        <p className="text-sm text-gray-500 mb-6">
            Hệ thống sẽ lưu dữ liệu vào <strong>Kho đang kích hoạt</strong>. Khi dung lượng đầy, hệ thống sẽ tự động chuyển sang Kho tiếp theo trong danh sách.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {slots.map((slot) => (
                <div key={slot.id} className={`p-4 rounded-xl border-2 transition-all ${getStatusColor(slot)} ${slot.isActive ? 'shadow-md ring-2 ring-green-500 ring-offset-2' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${slot.isActive ? 'bg-green-600' : 'bg-gray-400'}`}>
                                {slot.id}
                            </div>
                            <div>
                                <input 
                                    type="text" 
                                    value={slot.name}
                                    onChange={(e) => handleSlotChange(slot.id, 'name', e.target.value)}
                                    className="font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none w-40"
                                />
                                <div className="text-xs mt-1">
                                    {slot.isActive ? (
                                        <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10}/> Đang sử dụng</span>
                                    ) : (
                                        <span className="text-gray-400" onClick={() => handleSetActive(slot.id)}>Nhấn để kích hoạt</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-right">
                             <div className="text-xs text-gray-500 mb-1">Dung lượng (Mô phỏng)</div>
                             <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full ${slot.capacityUsed > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                    style={{ width: `${slot.capacityUsed}%` }}
                                 ></div>
                             </div>
                             <div className="text-[10px] text-right mt-1 font-mono">{slot.capacityUsed}% / 15GB</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Google Drive Folder ID</label>
                            <div className="flex items-center gap-2">
                                <img src="https://cdn-icons-png.flaticon.com/512/5968/5968523.png" className="w-4 h-4" alt="Drive"/>
                                <input 
                                    type="text" 
                                    value={slot.driveFolderId}
                                    onChange={(e) => handleSlotChange(slot.id, 'driveFolderId', e.target.value)}
                                    placeholder="VD: 1A2b3C..."
                                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Google Sheet ID (Log Data)</label>
                            <div className="flex items-center gap-2">
                                <img src="https://cdn-icons-png.flaticon.com/512/5968/5968528.png" className="w-4 h-4" alt="Sheet"/>
                                <input 
                                    type="text" 
                                    value={slot.sheetId}
                                    onChange={(e) => handleSlotChange(slot.id, 'sheetId', e.target.value)}
                                    placeholder="VD: 1XyZ_abc..."
                                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {!slot.isActive && (
                        <button 
                            onClick={() => handleSetActive(slot.id)}
                            className="mt-4 w-full py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                        >
                            Chuyển sang dùng kho này
                        </button>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;

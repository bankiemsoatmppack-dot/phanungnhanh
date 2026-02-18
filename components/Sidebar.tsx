
import React, { useState } from 'react';
import { Home, FileText, CheckSquare, BarChart2, Settings, Users, Folder, Bell, LogOut, User as UserIcon, Lock, X } from 'lucide-react';
import { UserRole } from '../types';

interface Props {
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  role: UserRole;
  notificationCount?: number;
}

const Sidebar: React.FC<Props> = ({ currentView, onChangeView, onLogout, role, notificationCount = 0 }) => {
  // Theme changes based on view
  const bgColor = currentView === 'DASHBOARD' ? 'bg-sidebar-red' : 'bg-blue-600';
  
  // Popover State
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  
  const menuItems = [
    { id: 'DASHBOARD', icon: Home, label: 'Dashboard' },
    // Notification Count here now refers to Announcements (if passed properly) or we keep it as generic alerts
    { id: 'NOTIFICATIONS', icon: Bell, label: 'Bảng tin', badge: notificationCount },
    { id: 'DOCUMENTS', icon: FileText, label: 'Hồ sơ' },
    { id: 'TASKS', icon: CheckSquare, label: 'Công việc' },
    { id: 'REPORTS', icon: BarChart2, label: 'Báo cáo' },
    // Only show Users tab for Admin
    ...(role === 'ADMIN' ? [{ id: 'USERS', icon: Users, label: 'Nhân sự' }] : []),
  ];

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Đổi mật khẩu thành công!");
      setShowPassModal(false);
      setShowUserMenu(false);
  };

  return (
    <div className={`w-16 md:w-20 ${bgColor} flex flex-col items-center py-6 text-white transition-colors duration-300 z-50 shadow-xl relative`}>
      <div className="mb-8 p-2 bg-white/20 rounded-lg">
        <Folder size={28} />
      </div>

      <div className="flex-1 flex flex-col gap-6 w-full">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`relative flex items-center justify-center p-3 w-full transition-all duration-200 group ${
              currentView === item.id ? 'bg-white/20 border-r-4 border-white' : 'hover:bg-white/10'
            }`}
          >
            <item.icon size={24} />
            
            {/* Notification Badge */}
            {item.badge ? (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold ring-2 ring-white">
                    {item.badge}
                </span>
            ) : null}

            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">
                {item.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-6 items-center">
        {/* User / Settings Menu */}
        <div className="relative">
            <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`p-3 hover:bg-white/10 rounded-lg ${showUserMenu ? 'bg-white/20' : ''}`}
            >
                <UserIcon size={24} />
            </button>
            
            {showUserMenu && (
                <div className="absolute bottom-full left-12 mb-2 w-48 bg-white rounded-lg shadow-xl text-gray-800 py-2 z-[60] border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
                    <button 
                        onClick={() => { onChangeView('SETTINGS'); setShowUserMenu(false); }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                    >
                        <Settings size={16}/> Cấu hình
                    </button>
                    <button 
                        onClick={() => setShowPassModal(true)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                    >
                        <Lock size={16}/> Đổi mật khẩu
                    </button>
                </div>
            )}
        </div>

        <button onClick={onLogout} className="p-3 hover:bg-white/10 rounded-lg"><LogOut size={24} /></button>
      </div>

      {/* Change Password Modal (Simple Portal) */}
      {showPassModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-gray-800">
                  <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                      <h3 className="font-bold">Đổi Mật Khẩu</h3>
                      <button onClick={() => setShowPassModal(false)}><X size={18}/></button>
                  </div>
                  <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu mới</label>
                          <input type="password" required className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-blue-500"/>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Xác nhận</label>
                          <input type="password" required className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-blue-500"/>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700">Lưu thay đổi</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Sidebar;

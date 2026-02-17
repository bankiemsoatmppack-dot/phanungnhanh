
import React from 'react';
import { Home, FileText, CheckSquare, BarChart2, Settings, Users, Folder, Bell, LogOut } from 'lucide-react';
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
  
  const menuItems = [
    { id: 'DASHBOARD', icon: Home, label: 'Dashboard' },
    { id: 'NOTIFICATIONS', icon: Bell, label: 'Thông báo', badge: notificationCount },
    { id: 'DOCUMENTS', icon: FileText, label: 'Hồ sơ' },
    { id: 'TASKS', icon: CheckSquare, label: 'Công việc' },
    { id: 'REPORTS', icon: BarChart2, label: 'Báo cáo' },
    // Only show Users tab for Admin
    ...(role === 'ADMIN' ? [{ id: 'USERS', icon: Users, label: 'Nhân sự' }] : []),
  ];

  return (
    <div className={`w-16 md:w-20 ${bgColor} flex flex-col items-center py-6 text-white transition-colors duration-300 z-50 shadow-xl`}>
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

      <div className="mt-auto flex flex-col gap-6">
        <button 
            onClick={() => onChangeView('SETTINGS')}
            className={`p-3 hover:bg-white/10 rounded-lg ${currentView === 'SETTINGS' ? 'bg-white/20' : ''}`}
        >
            <Settings size={24} />
        </button>
        <button onClick={onLogout} className="p-3 hover:bg-white/10 rounded-lg"><LogOut size={24} /></button>
      </div>
    </div>
  );
};

export default Sidebar;

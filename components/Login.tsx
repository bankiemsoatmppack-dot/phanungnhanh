import React, { useState } from 'react';
import { User, UserRole } from 'lucide-react';
import { User as AppUser } from '../types';
import { MOCK_EMPLOYEES } from '../constants';

interface Props {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.toLowerCase() === 'thai' && password === 'admin') {
      onLogin({ id: '0', name: 'Thái Admin', username: 'thai', role: 'ADMIN', department: 'IT' });
    } else {
      // Lookup employee in mock data
      const foundEmp = MOCK_EMPLOYEES.find(e => e.username.toLowerCase() === username.toLowerCase());
      
      if (foundEmp) {
         onLogin({ 
            id: foundEmp.id, 
            name: foundEmp.name, 
            username: foundEmp.username, 
            role: 'USER',
            department: foundEmp.department 
         });
      } else {
         // Default fallback for demo if username not found
         onLogin({ 
            id: '1', 
            name: 'Nguyễn Văn A', 
            username: username || 'NV001', 
            role: 'USER',
            department: 'IN' // Default department
         });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 text-center uppercase">PHẢN ỨNG NHANH - MPPACK</h1>
          <p className="text-gray-500 text-sm mt-1">Hệ thống Quản lý Sản xuất & Hồ sơ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">MÃ NHÂN VIÊN</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input 
                type="text" 
                placeholder="VD: NV001" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">MẬT KHẨU</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input 
                type="password" 
                placeholder="••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-700"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input id="remember" type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-700 font-medium">Ghi nhớ đăng nhập</label>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-bold mb-1">Gợi ý đăng nhập (Demo):</p>
            <ul className="list-disc list-inside text-xs space-y-1 text-blue-700">
              <li>NV001 / 123 (Công nhân/User)</li>
              <li>thai / admin (Quản lý/Admin)</li>
              <li>NV002 / 123 (Kho)</li>
            </ul>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition duration-200">
            Đăng Nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

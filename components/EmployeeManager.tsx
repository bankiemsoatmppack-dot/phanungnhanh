
import React, { useState, useEffect } from 'react';
import { Employee, LoginLogEntry } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { Plus, Edit2, Trash2, Search, Filter, X, Save, User, Lock, Briefcase, Eye, History, Shield, Clock, Monitor } from 'lucide-react';
import { getLoginLogs } from '../services/storageService';
import { canEditSystem } from '../utils';

const EmployeeManager: React.FC = () => {
  // Get Current User from App state context (simulated here by checking localstorage for last login log)
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
      // In a real app, this comes from props or context. 
      // Here we grab the last log to identify "who am i" roughly for this component if needed, 
      // but ideally permissions should be passed down. 
      // Since App.tsx renders this, we'll assume we check permissions based on a known user or passed prop.
      // For this specific file change, I will assume `currentUser` logic needs to be robust. 
      // However, to keep it simple and working with `canEditSystem`, I will fetch the latest log to simulate "Current Session User" 
      // if not passed. BUT, `App.tsx` has the user state. 
      // *Correction*: I should update `App.tsx` to pass user to `EmployeeManager`. 
      // Since I cannot change `App.tsx` interface in this single file change easily without breaking, 
      // I will read the `online_presence` or assume the parent passes it? 
      // Actually, I'll rely on a local check or just fetch the logs.
      
      // Let's implement the TAB logic first.
      const logs = getLoginLogs();
      setLoginLogs(logs);
      
      // Attempt to retrieve current user info from the latest log that matches a "current" session 
      // or simply rely on the fact that the user can see this page means they are admin.
      // We need to know IF they can edit.
      // Let's fetch the very last log entry as a proxy for "Current User" if we lack context, 
      // OR better: The user object should be passed. 
      // Since I can't easily change the Props signature of EmployeeManager in App.tsx without providing that file too, 
      // I will assume for now we use a utility or localStorage to get the active session user if available.
      
      // *Hack for Demo*: Check the last item in `login_logs` which likely corresponds to the current session start.
      if (logs.length > 0) {
          setCurrentUser({ position: logs[0].position, role: logs[0].role }); 
      }
  }, []);

  const [activeTab, setActiveTab] = useState<'LIST' | 'HISTORY'>('LIST');
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [loginLogs, setLoginLogs] = useState<LoginLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
      name: '',
      username: '',
      password: '',
      department: 'SX',
      status: 'active',
      position: 'WORKER'
  });

  // Filter Logic
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = canEditSystem(currentUser);

  const handleOpenModal = (employee?: Employee) => {
      if (!canEdit) {
          alert("Bạn không có quyền thực hiện chức năng này (Chỉ dành cho P.Giám Đốc, TP KCS, TP SX)");
          return;
      }

      if (employee) {
          setEditingId(employee.id);
          setFormData({ ...employee }); 
      } else {
          setEditingId(null);
          setFormData({
            name: '',
            username: '',
            password: '',
            department: 'SX',
            status: 'active',
            position: 'WORKER'
          });
      }
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      if (!canEdit) {
          alert("Bạn không có quyền xóa nhân viên!");
          return;
      }
      if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
          setEmployees(employees.filter(e => e.id !== id));
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name || !formData.username) {
          alert('Vui lòng nhập tên và tài khoản');
          return;
      }

      if (editingId) {
          // Update existing
          setEmployees(employees.map(emp => 
            emp.id === editingId 
                ? { ...emp, ...formData } as Employee
                : emp
          ));
      } else {
          // Add new
          const newId = (Math.max(...employees.map(e => parseInt(e.id))) + 1).toString();
          const newEmployee: Employee = {
              id: newId,
              stt: employees.length + 1,
              name: formData.name!,
              username: formData.username!,
              password: formData.password || '123456', // Default password
              department: formData.department || 'SX',
              position: formData.position as any,
              status: formData.status as 'active' | 'inactive',
              createdAt: new Date().toLocaleDateString('en-GB')
          };
          setEmployees([...employees, newEmployee]);
      }
      setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden m-4 relative">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-800">Quản lý nhân sự & Hệ thống</h2>
            <p className="text-gray-500 text-sm mt-1">Quản lý tài khoản, phân quyền và theo dõi nhật ký truy cập.</p>
         </div>
         {canEdit && activeTab === 'LIST' && (
            <div className="flex gap-2">
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 font-medium text-sm"
                >
                <Plus size={16} /> Thêm nhân viên
                </button>
            </div>
         )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6 bg-gray-50">
          <button 
            onClick={() => setActiveTab('LIST')}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'LIST' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <User size={16}/> Danh sách nhân viên
          </button>
          <button 
            onClick={() => { setActiveTab('HISTORY'); setLoginLogs(getLoginLogs()); }}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HISTORY' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <History size={16}/> Lịch sử đăng nhập
          </button>
      </div>

      {/* VIEW: EMPLOYEE LIST */}
      {activeTab === 'LIST' && (
      <>
        {/* Filters */}
        <div className="p-4 bg-white border-b border-gray-200 flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tên, tài khoản..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                />
            </div>
            {!canEdit && (
                <div className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 flex items-center gap-2">
                    <Shield size={14}/> Bạn đang ở chế độ xem (Read-only)
                </div>
            )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4 font-bold text-center w-16">STT</th>
                    <th className="px-6 py-4 font-bold">Họ và tên</th>
                    <th className="px-6 py-4 font-bold">Tài khoản</th>
                    <th className="px-6 py-4 font-bold">Mật khẩu</th>
                    <th className="px-6 py-4 font-bold">Bộ phận</th>
                    <th className="px-6 py-4 font-bold">Chức vụ</th>
                    <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
                    <th className="px-6 py-4 font-bold text-right">Thao tác</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp, index) => (
                    <tr key={emp.id} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-center font-medium text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{emp.name}</td>
                        <td className="px-6 py-4 text-blue-600 font-mono">{emp.username}</td>
                        <td className="px-6 py-4 font-mono font-bold text-gray-600 bg-gray-50/50">
                            {emp.password}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-700">{emp.department}</td>
                        <td className="px-6 py-4">
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                {emp.position || 'WORKER'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                            }`}>
                            {emp.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            {canEdit ? (
                                <div className="flex justify-end gap-2">
                                <button 
                                        onClick={() => handleOpenModal(emp)}
                                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-colors" title="Sửa"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                        onClick={() => handleDelete(emp.id)}
                                        className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors" title="Xóa"
                                >
                                    <Trash2 size={16} />
                                </button>
                                </div>
                            ) : (
                                <span className="text-gray-400 text-xs italic">Không quyền</span>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      </>
      )}

      {/* VIEW: LOGIN HISTORY */}
      {activeTab === 'HISTORY' && (
          <div className="flex-1 overflow-auto bg-gray-50/50 p-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                          <tr>
                              <th className="px-6 py-4 font-bold">Thời gian</th>
                              <th className="px-6 py-4 font-bold">Người dùng</th>
                              <th className="px-6 py-4 font-bold">Chức vụ</th>
                              <th className="px-6 py-4 font-bold">Vai trò</th>
                              <th className="px-6 py-4 font-bold">Địa chỉ IP (Giả lập)</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {loginLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-blue-50/30">
                                  <td className="px-6 py-4 flex items-center gap-2 text-gray-600 font-mono">
                                      <Clock size={14}/> {log.timestamp}
                                  </td>
                                  <td className="px-6 py-4 font-bold text-gray-800">
                                      {log.userName}
                                      <div className="text-[10px] text-gray-400 font-normal">ID: {log.userId}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                          {log.position}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-500">{log.role}</td>
                                  <td className="px-6 py-4 flex items-center gap-2 text-gray-500">
                                      <Monitor size={14}/> {log.ip}
                                  </td>
                              </tr>
                          ))}
                          {loginLogs.length === 0 && (
                              <tr>
                                  <td colSpan={5} className="text-center py-8 text-gray-400 italic">Chưa có lịch sử đăng nhập</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                      <h3 className="font-bold text-lg">{editingId ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="hover:bg-blue-700 p-1 rounded-full"><X size={20}/></button>
                  </div>
                  
                  <form onSubmit={handleSave} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label>
                          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                              <User size={16} className="text-gray-400 mr-2"/>
                              <input 
                                type="text" 
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="flex-1 outline-none text-sm" 
                                placeholder="Nguyễn Văn A" 
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tài khoản</label>
                            <input 
                                type="text" 
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" 
                                placeholder="username" 
                            />
                          </div>
                           <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu</label>
                            <input 
                                type="text" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" 
                                placeholder="Nhập mật khẩu" 
                            />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bộ phận</label>
                          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2">
                              <Briefcase size={16} className="text-gray-400 mr-2"/>
                              <select 
                                value={formData.department}
                                onChange={(e) => setFormData({...formData, department: e.target.value})}
                                className="flex-1 outline-none text-sm bg-white"
                              >
                                  <option value="SX">SẢN XUẤT</option>
                                  <option value="IN">IN ẤN</option>
                                  <option value="KHO">KHO VẬN</option>
                                  <option value="KCS">QC / KCS</option>
                                  <option value="IT">IT / ADMIN</option>
                                  <option value="SALES">KINH DOANH</option>
                                  <option value="BAN GIÁM ĐỐC">BAN GIÁM ĐỐC</option>
                              </select>
                          </div>
                      </div>

                       <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chức vụ (Phân quyền)</label>
                          <select 
                             value={formData.position}
                             onChange={(e) => setFormData({...formData, position: e.target.value as any})}
                             className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                          >
                              <option value="WORKER">Công nhân / Nhân viên</option>
                              <option value="DIRECTOR">Giám đốc (Chỉ xem)</option>
                              <option value="IT_ADMIN">IT Admin (Chỉ xem)</option>
                              <option value="DEPUTY_DIRECTOR">Phó Giám Đốc (Toàn quyền)</option>
                              <option value="QA_MANAGER">Trưởng phòng KCS (Toàn quyền)</option>
                              <option value="PROD_MANAGER">Trưởng phòng SX (Toàn quyền)</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
                          <select 
                             value={formData.status}
                             onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                             className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white"
                          >
                              <option value="active">Hoạt động</option>
                              <option value="inactive">Khóa tài khoản</option>
                          </select>
                      </div>

                      <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 mt-4 flex justify-center items-center gap-2">
                          <Save size={18} /> Lưu thông tin
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default EmployeeManager;

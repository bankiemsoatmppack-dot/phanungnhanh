
import React, { useState, useEffect } from 'react';
import { Employee, LoginLogEntry, UserPermissions, SystemLogEntry, LogCategory } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { Plus, Edit2, Trash2, Search, Filter, X, Save, User, Lock, Briefcase, Eye, History, Shield, Clock, Monitor, CheckSquare, Square, FileText, Activity, Database } from 'lucide-react';
import { getLoginLogs, getActionLogs, logAction } from '../services/storageService';
import { canEditSystem } from '../utils';

const EmployeeManager: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
      const logs = getLoginLogs();
      setLoginLogs(logs);
      if (logs.length > 0) {
          setCurrentUser({ position: logs[0].position, role: logs[0].role, id: logs[0].userId, name: logs[0].userName }); 
      }
      // Load Action Logs
      setSystemLogs(getActionLogs('ALL'));
  }, []);

  const [activeTab, setActiveTab] = useState<'LIST' | 'HISTORY_LOGIN' | 'HISTORY_SYSTEM'>('LIST');
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [loginLogs, setLoginLogs] = useState<LoginLogEntry[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<'ALL' | LogCategory>('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
      name: '',
      username: '',
      password: '',
      department: 'SX',
      status: 'active',
      position: 'WORKER',
      permissions: { view: true, add: false, edit: false, delete: false }
  });

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSystemLogs = systemLogs.filter(log => {
      if (logCategoryFilter !== 'ALL' && log.category !== logCategoryFilter) return false;
      return true;
  });

  const canEdit = canEditSystem(currentUser);
  // Only Deputy Director can change permissions
  const canManagePermissions = currentUser?.position === 'DEPUTY_DIRECTOR';

  const handleOpenModal = (employee?: Employee) => {
      if (!canEdit) {
          alert("Bạn không có quyền thực hiện chức năng này");
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
            position: 'WORKER',
            permissions: { view: true, add: false, edit: false, delete: false }
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
          const emp = employees.find(e => e.id === id);
          setEmployees(employees.filter(e => e.id !== id));
          if(emp && currentUser) {
              logAction(currentUser, 'DELETE', 'EMPLOYEE', emp.name, `Xóa nhân viên ${emp.username}`);
          }
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
          if(currentUser) logAction(currentUser, 'UPDATE', 'EMPLOYEE', formData.name, `Cập nhật thông tin nhân viên ${formData.username}`);
      } else {
          // Add new
          const newId = (Math.max(...employees.map(e => parseInt(e.id))) + 1).toString();
          const newEmployee: Employee = {
              id: newId,
              stt: employees.length + 1,
              name: formData.name!,
              username: formData.username!,
              password: formData.password || '123456',
              department: formData.department || 'SX',
              position: formData.position as any,
              status: formData.status as 'active' | 'inactive',
              permissions: formData.permissions || { view: true, add: false, edit: false, delete: false },
              createdAt: new Date().toLocaleDateString('en-GB')
          };
          setEmployees([...employees, newEmployee]);
          if(currentUser) logAction(currentUser, 'CREATE', 'EMPLOYEE', newEmployee.name, `Thêm nhân viên mới ${newEmployee.username}`);
      }
      setIsModalOpen(false);
  };

  // --- PERMISSION HANDLERS ---
  const togglePermission = (empId: string, perm: keyof UserPermissions) => {
      if (!canManagePermissions) return;

      const emp = employees.find(e => e.id === empId);
      if(!emp) return;

      setEmployees(prev => prev.map(e => {
          if (e.id === empId) {
              return {
                  ...e,
                  permissions: {
                      ...e.permissions,
                      [perm]: !e.permissions[perm]
                  }
              };
          }
          return e;
      }));
      
      if(currentUser) logAction(currentUser, 'UPDATE', 'EMPLOYEE', emp.name, `Thay đổi quyền ${perm} cho ${emp.username}`);
  };

  const toggleAllPermissions = (perm: keyof UserPermissions) => {
      if (!canManagePermissions) return;
      
      // Check if all are currently checked
      const allChecked = filteredEmployees.every(emp => emp.permissions[perm]);
      const newValue = !allChecked;

      setEmployees(prev => prev.map(emp => {
          // Only update filtered employees (if search is active)
          if (filteredEmployees.some(fe => fe.id === emp.id)) {
              return {
                  ...emp,
                  permissions: {
                      ...emp.permissions,
                      [perm]: newValue
                  }
              };
          }
          return emp;
      }));
      if(currentUser) logAction(currentUser, 'UPDATE', 'EMPLOYEE', 'Batch Update', `Thay đổi hàng loạt quyền ${perm}`);
  };

  // Helper to render checkbox column header
  const RenderPermHeader = ({ label, permKey }: { label: string, permKey: keyof UserPermissions }) => {
      const allChecked = filteredEmployees.length > 0 && filteredEmployees.every(emp => emp.permissions[permKey]);
      const someChecked = filteredEmployees.some(emp => emp.permissions[permKey]);
      
      return (
          <div className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => toggleAllPermissions(permKey)}>
              <span className="text-[10px] uppercase font-bold text-gray-500">{label}</span>
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  !canManagePermissions ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' : 
                  (allChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400 group-hover:border-blue-500')
              }`}>
                  {allChecked && <CheckSquare size={10} className="text-white"/>}
                  {!allChecked && someChecked && <div className="w-2 h-2 bg-blue-400 rounded-sm"></div>}
              </div>
          </div>
      );
  };

  return (
    // Changed: Removed margin (m-4) and added w-full, border-t to make it full screen / flush
    <div className="flex flex-col h-full w-full bg-white border-t border-gray-200 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
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
            onClick={() => { setActiveTab('HISTORY_LOGIN'); setLoginLogs(getLoginLogs()); }}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HISTORY_LOGIN' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <History size={16}/> Lịch sử đăng nhập
          </button>
          <button 
            onClick={() => { setActiveTab('HISTORY_SYSTEM'); setSystemLogs(getActionLogs('ALL')); }}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'HISTORY_SYSTEM' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              <Activity size={16}/> Lịch sử thao tác (Audit)
          </button>
      </div>

      {/* VIEW: EMPLOYEE LIST */}
      {activeTab === 'LIST' && (
      <>
        {/* Filters */}
        <div className="p-4 bg-white border-b border-gray-200 flex gap-4 items-center justify-between">
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
            
            <div className="flex items-center gap-3">
                 {canManagePermissions ? (
                     <div className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                         <Shield size={14}/> Bạn có quyền Phân quyền
                     </div>
                 ) : (
                    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2 opacity-80">
                         <Lock size={14}/> Chỉ Phó GĐ được phân quyền
                     </div>
                 )}
                 {!canEdit && (
                    <div className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-100 flex items-center gap-2">
                        <Shield size={14}/> Read-only Mode
                    </div>
                )}
            </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 border-b border-gray-200 z-10 shadow-sm">
                <tr>
                    <th className="px-4 py-4 font-bold text-center w-12">STT</th>
                    <th className="px-4 py-4 font-bold">Thông tin nhân viên</th>
                    <th className="px-4 py-4 font-bold">Tài khoản</th>
                    <th className="px-4 py-4 font-bold">Bộ phận / Chức vụ</th>
                    
                    {/* PERMISSION COLUMNS */}
                    <th className="px-2 py-4 text-center border-l border-gray-200 bg-blue-50/50 w-16">
                        <RenderPermHeader label="Xem" permKey="view"/>
                    </th>
                    <th className="px-2 py-4 text-center border-l border-gray-200 bg-blue-50/50 w-16">
                         <RenderPermHeader label="Thêm" permKey="add"/>
                    </th>
                    <th className="px-2 py-4 text-center border-l border-gray-200 bg-blue-50/50 w-16">
                         <RenderPermHeader label="Sửa" permKey="edit"/>
                    </th>
                    <th className="px-2 py-4 text-center border-l border-gray-200 bg-blue-50/50 w-16">
                         <RenderPermHeader label="Xóa" permKey="delete"/>
                    </th>

                    <th className="px-4 py-4 font-bold text-center w-24 border-l border-gray-200">Trạng thái</th>
                    <th className="px-4 py-4 font-bold text-right w-20">Thao tác</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp, index) => (
                    <tr key={emp.id} className="bg-white hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3 text-center font-medium text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                            <div className="font-bold text-gray-800">{emp.name}</div>
                            <div className="text-[10px] text-gray-400">ID: {emp.id}</div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="text-blue-600 font-mono font-bold text-xs">{emp.username}</div>
                            <div className="text-[10px] text-gray-400">********</div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="font-medium text-gray-700 text-xs">{emp.department}</div>
                            <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                {emp.position || 'WORKER'}
                            </span>
                        </td>

                        {/* PERMISSION CHECKBOXES */}
                        {(['view', 'add', 'edit', 'delete'] as const).map(perm => (
                            <td key={perm} className="px-2 py-3 text-center border-l border-gray-100 bg-gray-50/30 group-hover:bg-white transition-colors">
                                <div 
                                    onClick={() => togglePermission(emp.id, perm)}
                                    className={`w-5 h-5 mx-auto rounded border flex items-center justify-center transition-all ${
                                        !canManagePermissions ? 'cursor-not-allowed opacity-60 bg-gray-100 border-gray-300' : 
                                        'cursor-pointer hover:border-blue-500 bg-white border-gray-300'
                                    } ${emp.permissions?.[perm] ? 'bg-blue-600 border-blue-600' : ''}`}
                                >
                                    {emp.permissions?.[perm] && <CheckSquare size={14} className="text-white"/>}
                                </div>
                            </td>
                        ))}

                        <td className="px-4 py-3 text-center border-l border-gray-100">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                            }`}>
                            {emp.status === 'active' ? 'Active' : 'Locked'}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                            {canEdit ? (
                                <div className="flex justify-end gap-1">
                                <button 
                                        onClick={() => handleOpenModal(emp)}
                                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors" title="Sửa thông tin"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button 
                                        onClick={() => handleDelete(emp.id)}
                                        className="p-1.5 hover:bg-red-100 text-red-500 rounded transition-colors" title="Xóa nhân viên"
                                >
                                    <Trash2 size={14} />
                                </button>
                                </div>
                            ) : (
                                <span className="text-gray-300 text-xs">—</span>
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
      {activeTab === 'HISTORY_LOGIN' && (
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

      {/* VIEW: SYSTEM AUDIT LOGS */}
      {activeTab === 'HISTORY_SYSTEM' && (
          <div className="flex flex-col h-full bg-gray-50/50">
              {/* Category Filter */}
              <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-2 overflow-x-auto">
                  <button 
                    onClick={() => setLogCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${logCategoryFilter === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                      Tất cả
                  </button>
                  <button 
                    onClick={() => setLogCategoryFilter('DOCUMENT')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1 ${logCategoryFilter === 'DOCUMENT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-gray-300 hover:bg-blue-50'}`}
                  >
                      <FileText size={12}/> Hồ sơ (Sheet Docs)
                  </button>
                  <button 
                    onClick={() => setLogCategoryFilter('EMPLOYEE')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1 ${logCategoryFilter === 'EMPLOYEE' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-gray-300 hover:bg-purple-50'}`}
                  >
                      <User size={12}/> Nhân viên (Sheet Emps)
                  </button>
                  <button 
                    onClick={() => setLogCategoryFilter('SYSTEM')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-1 ${logCategoryFilter === 'SYSTEM' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-gray-300 hover:bg-orange-50'}`}
                  >
                      <Database size={12}/> Hệ thống (Sheet Sys)
                  </button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 sticky top-0">
                              <tr>
                                  <th className="px-6 py-4 font-bold w-40">Thời gian</th>
                                  <th className="px-6 py-4 font-bold w-48">Người thực hiện</th>
                                  <th className="px-6 py-4 font-bold w-32">Loại</th>
                                  <th className="px-6 py-4 font-bold w-24">Hành động</th>
                                  <th className="px-6 py-4 font-bold">Đối tượng</th>
                                  <th className="px-6 py-4 font-bold">Chi tiết thay đổi</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredSystemLogs.map((log) => (
                                  <tr key={log.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                                          {log.timestamp}
                                      </td>
                                      <td className="px-6 py-4">
                                          <div className="font-bold text-gray-800 text-xs">{log.actorName}</div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                              log.category === 'DOCUMENT' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                              log.category === 'EMPLOYEE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                              'bg-orange-50 text-orange-700 border-orange-100'
                                          }`}>
                                              {log.category}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                              log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                              log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                              log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-gray-100 text-gray-600'
                                          }`}>
                                              {log.action}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 font-medium text-gray-700 text-xs">
                                          {log.targetName || 'N/A'}
                                      </td>
                                      <td className="px-6 py-4 text-gray-600 text-xs">
                                          {log.description}
                                      </td>
                                  </tr>
                              ))}
                              {filteredSystemLogs.length === 0 && (
                                  <tr>
                                      <td colSpan={6} className="text-center py-12 text-gray-400 italic">Không có dữ liệu nhật ký phù hợp</td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
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
                      {/* ... (Existing Form Fields) ... */}
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


import React, { useState } from 'react';
import { Employee } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { Plus, Edit2, Trash2, Search, Filter, X, Save, User, Lock, Briefcase } from 'lucide-react';

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
      name: '',
      username: '',
      password: '',
      department: 'SX',
      status: 'active'
  });

  // Filter Logic
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (employee?: Employee) => {
      if (employee) {
          setEditingId(employee.id);
          setFormData({ ...employee, password: '' }); // Don't show existing password
      } else {
          setEditingId(null);
          setFormData({
            name: '',
            username: '',
            password: '',
            department: 'SX',
            status: 'active'
          });
      }
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
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
            <h2 className="text-2xl font-bold text-gray-800">Quản lý nhân viên</h2>
            <p className="text-gray-500 text-sm mt-1">Danh sách nhân sự và tài khoản hệ thống</p>
         </div>
         <div className="flex gap-2">
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 font-medium text-sm"
            >
               <Plus size={16} /> Thêm nhân viên
            </button>
         </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-4 items-center">
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
         <button className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600">
            <Filter size={18} />
         </button>
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
                  <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
                  <th className="px-6 py-4 font-bold">Ngày tạo</th>
                  <th className="px-6 py-4 font-bold text-right">Thao tác</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {filteredEmployees.map((emp, index) => (
                  <tr key={emp.id} className="bg-white hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4 text-center font-medium text-gray-500">{index + 1}</td>
                     <td className="px-6 py-4 font-semibold text-gray-800">{emp.name}</td>
                     <td className="px-6 py-4 text-blue-600 font-mono">{emp.username}</td>
                     <td className="px-6 py-4 text-gray-400">••••••</td>
                     <td className="px-6 py-4 font-medium text-gray-700">{emp.department}</td>
                     <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                           emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                           {emp.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-gray-500">{emp.createdAt}</td>
                     <td className="px-6 py-4 text-right">
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
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

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
                                type="password" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" 
                                placeholder={editingId ? "Giữ nguyên" : "Mặc định"} 
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
                              </select>
                          </div>
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

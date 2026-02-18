
import React, { useState, useEffect } from 'react';
import { Announcement, User } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { Bell, Megaphone, Send, CheckCircle, Eye, Calendar, Plus, Trash2, User as UserIcon, Clock, X, AlertTriangle, Info, Edit3, Save } from 'lucide-react';

interface Props {
  user: User; // Current User to check read status
  announcements: Announcement[];
  onMarkAsRead: (announcementId: string) => void;
  onCreateAnnouncement?: (ann: Announcement) => void; // Admin Only
  onDeleteAnnouncement?: (id: string) => void; // Admin Only
  onUpdateAnnouncement?: (ann: Announcement) => void; // Admin Only
}

const Notifications: React.FC<Props> = ({ user, announcements, onMarkAsRead, onCreateAnnouncement, onDeleteAnnouncement, onUpdateAnnouncement }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');

  // State for Read Details Modal
  const [selectedAnnouncementForDetails, setSelectedAnnouncementForDetails] = useState<Announcement | null>(null);

  // Split Announcements
  const generalAnnouncements = announcements.filter(a => a.type === 'general' || !a.type).sort((a,b) => b.id.localeCompare(a.id));
  const systemAnnouncements = announcements.filter(a => a.type === 'system').sort((a,b) => b.id.localeCompare(a.id));

  const handleEdit = (ann: Announcement) => {
      setEditingId(ann.id);
      setFormTitle(ann.title);
      setFormContent(ann.content);
      setIsCreating(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formTitle || !formContent) return;

      if (editingId && onUpdateAnnouncement) {
          // Update Mode
          const existing = announcements.find(a => a.id === editingId);
          if (existing) {
              const updatedAnn: Announcement = {
                  ...existing,
                  title: formTitle,
                  content: formContent,
                  // Keep original date or update? Usually keep original date for edits
              };
              onUpdateAnnouncement(updatedAnn);
          }
      } else if (onCreateAnnouncement) {
          // Create Mode
          const newAnn: Announcement = {
              id: Date.now().toString(),
              title: formTitle,
              content: formContent,
              date: new Date().toLocaleDateString('en-GB'),
              author: user.name, // Admin Name
              readLog: [],
              type: 'general'
          };
          onCreateAnnouncement(newAnn);
      }
      
      // Reset
      setFormTitle('');
      setFormContent('');
      setEditingId(null);
      setIsCreating(false);
  };

  const renderAnnouncementCard = (item: Announcement, isSystem: boolean) => {
        const isRead = item.readLog.some(log => log.userId === user.id);
        const readCount = item.readLog.length;
        const totalUsers = MOCK_EMPLOYEES.length; 

        return (
            <div 
                key={item.id} 
                onClick={() => {
                    if (!isRead && user.role === 'USER') onMarkAsRead(item.id);
                }}
                className={`bg-white rounded-xl p-4 shadow-sm border mb-3 transition-all relative group ${
                    isSystem 
                        ? 'border-red-200 bg-red-50/30' 
                        : (isRead ? 'border-gray-200' : 'border-blue-200 ring-1 ring-blue-100')
                }`}
            >
                {/* Admin Controls */}
                {user.role === 'ADMIN' && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded backdrop-blur-sm p-1">
                        {!isSystem && (
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Sửa">
                                <Edit3 size={14}/>
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onDeleteAnnouncement?.(item.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                            <Trash2 size={14}/>
                        </button>
                    </div>
                )}

                <div className="flex justify-between items-start mb-2 pr-12">
                    <div className="flex flex-col">
                        <h3 className={`font-bold text-sm ${isSystem ? 'text-red-700 uppercase flex items-center gap-1' : (isRead ? 'text-gray-700' : 'text-blue-700')}`}>
                            {isSystem && <AlertTriangle size={14}/>}
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Calendar size={10}/> {item.date}</span>
                            {!isSystem && <span className="flex items-center gap-1 font-semibold text-gray-600"><UserIcon size={10}/> {item.author}</span>}
                        </div>
                    </div>
                    {!isSystem && !isRead && user.role === 'USER' && (
                         <span className="text-blue-600 text-[9px] font-bold animate-pulse bg-blue-50 px-2 py-0.5 rounded-full">Mới</span>
                    )}
                </div>

                <div className="">
                    <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{item.content}</p>
                </div>

                {/* ADMIN VIEW: READ STATS (Only for General) */}
                {user.role === 'ADMIN' && !isSystem && (
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedAnnouncementForDetails(item); }}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <Eye size={12} /> 
                            <span className="font-bold underline">Đã xem: {readCount}/{totalUsers}</span>
                        </button>
                    </div>
                )}
            </div>
        );
  };

  return (
    <div className="flex-1 bg-gray-50 p-4 md:p-6 overflow-y-auto relative h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-lg text-white shadow-lg shadow-blue-500/30">
                <Megaphone size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Bảng tin & Cảnh báo</h2>
                <p className="text-gray-500 text-xs">Cập nhật tin tức nội bộ và theo dõi lỗi hệ thống</p>
            </div>
          </div>
          
          {user.role === 'ADMIN' && !isCreating && (
              <button 
                  onClick={() => {
                      setFormTitle('');
                      setFormContent('');
                      setEditingId(null);
                      setIsCreating(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-colors"
              >
                  <Plus size={16}/> Tạo thông báo
              </button>
          )}
      </div>

      {/* CREATE / EDIT FORM */}
      {isCreating && (
         <div className="bg-white rounded-xl shadow-md border border-blue-200 p-4 mb-6 animate-in slide-in-from-top-4">
             <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                 <h3 className="font-bold text-blue-700 flex items-center gap-2">
                     {editingId ? <Edit3 size={18}/> : <Send size={18}/>} 
                     {editingId ? 'Chỉnh sửa thông báo' : 'Soạn thông báo mới'}
                 </h3>
                 <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiêu đề</label>
                      <input 
                          type="text" 
                          value={formTitle} 
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none font-bold text-gray-800"
                          placeholder="Nhập tiêu đề..."
                          autoFocus
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nội dung</label>
                      <textarea 
                          value={formContent} 
                          onChange={(e) => setFormContent(e.target.value)}
                          rows={4}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                          placeholder="Nhập nội dung..."
                      />
                  </div>
                  <div className="flex justify-end pt-2">
                      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center gap-2">
                          <Save size={16}/> {editingId ? 'Lưu thay đổi' : 'Gửi thông báo'}
                      </button>
                  </div>
             </form>
         </div>
      )}

      {/* TWO COLUMNS LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden min-h-0">
          
          {/* COLUMN 1: GENERAL ANNOUNCEMENTS */}
          <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
              <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                      <Info size={16}/> Thông Báo Nhân Viên
                  </div>
                  <span className="bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{generalAnnouncements.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                  {generalAnnouncements.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 italic text-sm">Không có thông báo nào</div>
                  ) : (
                      generalAnnouncements.map(item => renderAnnouncementCard(item, false))
                  )}
              </div>
          </div>

          {/* COLUMN 2: SYSTEM ALERTS */}
          <div className="flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                      <AlertTriangle size={16}/> Hệ Thống Lỗi / Cảnh Báo
                  </div>
                  <span className="bg-red-200 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{systemAnnouncements.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                  {systemAnnouncements.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                          <CheckCircle size={32} className="mb-2 text-green-500 opacity-50"/>
                          <p className="text-sm">Hệ thống hoạt động bình thường</p>
                      </div>
                  ) : (
                      systemAnnouncements.map(item => renderAnnouncementCard(item, true))
                  )}
              </div>
          </div>
      </div>

      {/* READ DETAILS MODAL (Same as before) */}
      {selectedAnnouncementForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
                  <div className="bg-blue-600 p-4 text-white rounded-t-xl flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="font-bold text-sm">Chi tiết người xem</h3>
                          <p className="text-xs opacity-80 truncate max-w-[250px]">{selectedAnnouncementForDetails.title}</p>
                      </div>
                      <button onClick={() => setSelectedAnnouncementForDetails(null)}><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-0">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                              <tr>
                                  <th className="px-4 py-3">Nhân viên</th>
                                  <th className="px-4 py-3">Thời gian xem</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {selectedAnnouncementForDetails.readLog.length === 0 ? (
                                  <tr>
                                      <td colSpan={2} className="px-4 py-8 text-center text-gray-400 italic">Chưa có ai xem thông báo này.</td>
                                  </tr>
                              ) : (
                                selectedAnnouncementForDetails.readLog.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                {log.userName.charAt(0)}
                                            </div>
                                            {log.userName}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                            {log.timestamp}
                                        </td>
                                    </tr>
                                ))
                              )}
                          </tbody>
                      </table>
                  </div>
                  
                  <div className="p-3 border-t border-gray-200 bg-gray-50 text-center rounded-b-xl">
                      <button onClick={() => setSelectedAnnouncementForDetails(null)} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">Đóng</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Notifications;

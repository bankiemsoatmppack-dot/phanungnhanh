
import React, { useState } from 'react';
import { Announcement, User } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { Bell, Megaphone, Send, CheckCircle, Eye, Calendar, Plus, Trash2, User as UserIcon, Clock, X } from 'lucide-react';

interface Props {
  user: User; // Current User to check read status
  announcements: Announcement[];
  onMarkAsRead: (announcementId: string) => void;
  onCreateAnnouncement?: (ann: Announcement) => void; // Admin Only
}

const Notifications: React.FC<Props> = ({ user, announcements, onMarkAsRead, onCreateAnnouncement }) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  // State for Read Details Modal
  const [selectedAnnouncementForDetails, setSelectedAnnouncementForDetails] = useState<Announcement | null>(null);

  // Sort by Date (Descending)
  const sortedList = [...announcements].sort((a, b) => {
     // Simple string compare for DD/MM/YYYY is risky, best convert to Date objects. 
     // For demo, we assume format allows basic sorting or we parse.
     const dateA = a.date.split('/').reverse().join('');
     const dateB = b.date.split('/').reverse().join('');
     return dateB.localeCompare(dateA);
  });

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle || !newContent || !onCreateAnnouncement) return;

      const newAnn: Announcement = {
          id: Date.now().toString(),
          title: newTitle,
          content: newContent,
          date: new Date().toLocaleDateString('en-GB'),
          author: user.name, // Admin Name
          readLog: []
      };
      
      onCreateAnnouncement(newAnn);
      setNewTitle('');
      setNewContent('');
      setActiveTab('LIST');
      alert('Đã gửi thông báo thành công!');
  };

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-lg text-white shadow-lg shadow-blue-500/30">
                <Megaphone size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Bảng tin nội bộ</h2>
                <p className="text-gray-500 text-sm">Thông báo kế hoạch, sự kiện và tin tức công ty</p>
            </div>
            </div>
            
            {user.role === 'ADMIN' && (
                <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                    <button 
                        onClick={() => setActiveTab('LIST')}
                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'LIST' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Danh sách
                    </button>
                    <button 
                        onClick={() => setActiveTab('CREATE')}
                        className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'CREATE' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        + Tạo mới
                    </button>
                </div>
            )}
        </div>

        {activeTab === 'CREATE' && user.role === 'ADMIN' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in zoom-in-95">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-700">
                    <Send size={18} /> Soạn thông báo mới
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tiêu đề</label>
                        <input 
                            type="text" 
                            value={newTitle} 
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none font-bold"
                            placeholder="VD: Lịch đón đoàn khách..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nội dung chi tiết</label>
                        <textarea 
                            value={newContent} 
                            onChange={(e) => setNewContent(e.target.value)}
                            rows={5}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:border-blue-500 outline-none"
                            placeholder="Nhập nội dung thông báo..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setActiveTab('LIST')} className="px-5 py-2 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-50">Hủy</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30">Phát hành ngay</button>
                    </div>
                </form>
            </div>
        ) : (
            <div className="space-y-4">
                {sortedList.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">Chưa có thông báo nào.</div>
                ) : (
                    sortedList.map(item => {
                        const isRead = item.readLog.some(log => log.userId === user.id);
                        const readCount = item.readLog.length;
                        const totalUsers = MOCK_EMPLOYEES.length; 

                        return (
                            <div 
                                key={item.id} 
                                onClick={() => {
                                    if (!isRead && user.role === 'USER') onMarkAsRead(item.id);
                                }}
                                className={`bg-white rounded-xl p-5 shadow-sm border transition-all relative overflow-hidden group ${
                                    isRead ? 'border-gray-200 opacity-90' : 'border-blue-200 ring-1 ring-blue-100'
                                } ${!isRead && user.role === 'USER' ? 'cursor-pointer hover:shadow-md' : ''}`}
                            >
                                {/* Unread Indicator Stripe */}
                                {!isRead && (
                                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500"></div>
                                )}

                                <div className="flex justify-between items-start mb-2 pl-2">
                                    <div className="flex flex-col">
                                        <h3 className={`text-lg font-bold ${isRead ? 'text-gray-700' : 'text-blue-700'}`}>
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="flex items-center gap-1"><Calendar size={12}/> {item.date}</span>
                                            <span className="flex items-center gap-1 font-semibold text-gray-600"><UserIcon size={12}/> {item.author}</span>
                                        </div>
                                    </div>
                                    {isRead ? (
                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
                                            <CheckCircle size={12} /> Đã đọc
                                        </span>
                                    ) : (
                                        user.role === 'USER' && <span className="text-blue-600 text-xs font-bold animate-pulse">Mới</span>
                                    )}
                                </div>

                                <div className="pl-2">
                                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                </div>

                                {/* ADMIN VIEW: READ STATS */}
                                {user.role === 'ADMIN' && (
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedAnnouncementForDetails(item); }}
                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            <Eye size={14} /> 
                                            <span className="font-bold underline">Đã xem: {readCount} / {totalUsers} nhân viên</span>
                                        </button>
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {item.readLog.slice(0, 5).map((log, idx) => (
                                                <div key={idx} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-600" title={`${log.userName} (${log.timestamp})`}>
                                                    {log.userName.charAt(0)}
                                                </div>
                                            ))}
                                            {readCount > 5 && (
                                                <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                    +{readCount - 5}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        )}
      </div>

      {/* READ DETAILS MODAL */}
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


import React from 'react';
import { DocNotification } from '../types';
import { MessageSquare, AlertCircle, Image as ImageIcon, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface Props {
  notifications: DocNotification[];
  onSelectNotification: (docId: string, notifId: string) => void;
}

const UrgentNotifications: React.FC<Props> = ({ notifications, onSelectNotification }) => {
  const sorted = [...notifications].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-hidden flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-yellow-500 p-2.5 rounded-lg text-white shadow-lg shadow-yellow-500/30">
                 <MessageSquare size={20} />
             </div>
             <div>
                 <h2 className="text-xl font-bold text-gray-800">Tin nhắn & Sự cố Mới</h2>
                 <p className="text-gray-500 text-xs">Danh sách tin nhắn, hình ảnh và báo lỗi từ các hồ sơ cần xử lý ngay.</p>
             </div>
          </div>
          <div className="text-sm font-bold text-gray-600 bg-white px-3 py-1 rounded-full border shadow-sm">
              Tổng số: {notifications.length}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
          {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <CheckCircle size={64} className="text-green-500 opacity-20 mb-4"/>
                  <p className="font-medium">Không có tin nhắn hay lỗi mới nào.</p>
                  <p className="text-sm">Hệ thống đang hoạt động ổn định.</p>
              </div>
          ) : (
              <div className="grid grid-cols-1 gap-3">
                  {sorted.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => onSelectNotification(notif.docId, notif.id)}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all group relative overflow-hidden"
                      >
                          {/* Left Border Indicator */}
                          <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                              notif.type === 'DEFECT' ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>

                          <div className="flex items-start gap-4 pl-2">
                               {/* Icon */}
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                   notif.type === 'DEFECT' ? 'bg-red-100 text-red-600' : 
                                   notif.type === 'IMAGE' ? 'bg-orange-100 text-orange-600' :
                                   'bg-blue-100 text-blue-600'
                               }`}>
                                   {notif.type === 'DEFECT' ? <AlertCircle size={20}/> : 
                                    notif.type === 'IMAGE' ? <ImageIcon size={20}/> :
                                    <MessageSquare size={20}/>}
                               </div>

                               <div className="flex-1 min-w-0">
                                   <div className="flex justify-between items-start">
                                       <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                                                {notif.sender} • {notif.poCode}
                                            </span>
                                            <h4 className="font-bold text-gray-800 text-sm truncate">{notif.docTitle}</h4>
                                       </div>
                                       <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                           <Clock size={10}/> {notif.timestamp}
                                       </span>
                                   </div>

                                   <div className="mt-2 bg-gray-50 rounded-lg p-2.5 flex items-start gap-2">
                                       <span className="font-bold text-xs text-gray-700 whitespace-nowrap">{notif.messageSender}:</span>
                                       <p className="text-xs text-gray-600 line-clamp-2">{notif.content}</p>
                                   </div>
                               </div>

                               <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                                       <ArrowRight size={16} />
                                   </div>
                               </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default UrgentNotifications;

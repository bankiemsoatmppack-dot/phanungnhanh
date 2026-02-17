import React, { useState, useEffect, useRef } from 'react';
import { User as AppUser, MobileTask, ChatMessage } from '../types';
import { MOCK_TASKS, MOCK_MOBILE_CHAT } from '../constants';
import ImageViewer from './ImageViewer';
import { compressImage, sendBrowserNotification } from '../utils';
import { LogOut, Search, Folder, Clock, Check, ArrowLeft, Image as ImageIcon, Send, Plus, X, Calendar, User } from 'lucide-react';

interface Props {
  user: AppUser;
  onLogout: () => void;
}

const MobileUserView: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'MY_ITEMS' | 'ALL'>('MY_ITEMS');
  const [tasks, setTasks] = useState<MobileTask[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<MobileTask | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MOBILE_CHAT);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({
      sender: '', // Mục lớn
      title: '', // Mục con
      code: '', // Phiếu SX
  });

  // Request Notification Permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
  }, []);

  // Simulate Incoming Message (Demo for Notification)
  useEffect(() => {
    const timer = setInterval(() => {
        const random = Math.random();
        if (random > 0.95) { // 5% chance every 5s
            const incomingMsg: ChatMessage = {
                id: Date.now().toString(),
                sender: 'Admin (Hệ thống)',
                role: 'Quản lý',
                avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
                text: 'Có cập nhật mới về tiến độ sản xuất.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: false
            };
            
            // Only add if we are NOT inside the chat or looking at it
            // Simple logic: Add to list, if selectedTask is null, show notification
            setMessages(prev => [...prev, incomingMsg]);
            
            if (!selectedTask) {
               sendBrowserNotification("Tin nhắn mới từ MPPACK", "Admin: Có cập nhật mới về tiến độ sản xuất.");
            }
        }
    }, 10000); // Check every 10s
    return () => clearInterval(timer);
  }, [selectedTask]);

  const myTasks = tasks.filter(t => t.isMyTask);
  const allTasks = tasks;
  let displayTasks = activeTab === 'MY_ITEMS' ? myTasks : allTasks;

  if (searchTerm) {
    displayTasks = displayTasks.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  displayTasks.sort((a, b) => {
     const dateA = a.date.split('/').reverse().join('');
     const dateB = b.date.split('/').reverse().join('');
     return dateB.localeCompare(dateA);
  });

  const uniqueSenders = Array.from(new Set(tasks.map(t => t.sender).filter(Boolean))) as string[];

  const handleSendMessage = async () => {
    if (!chatMessage.trim() && (!fileInputRef.current?.files || fileInputRef.current.files.length === 0)) return;
    
    // Handle Images
    const images: string[] = [];
    if (fileInputRef.current?.files && fileInputRef.current.files.length > 0) {
        const files = Array.from(fileInputRef.current.files);
        for (const file of files) {
            try {
                const compressed = await compressImage(file as File);
                images.push(compressed);
            } catch (e) {
                console.error("Compression failed", e);
            }
        }
        // Clear input
        fileInputRef.current.value = '';
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Bạn',
      role: 'Bạn',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      text: chatMessage,
      images: images, // Send array of images
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      isMe: true
    };
    
    setMessages([...messages, newMessage]);
    setChatMessage('');
  };

  const handleSaveNewProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProfile.sender || !newProfile.title || !newProfile.code) {
          alert("Vui lòng nhập đầy đủ thông tin!");
          return;
      }

      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;

      const newTask: MobileTask = {
          id: Date.now().toString(),
          sender: newProfile.sender,
          title: newProfile.title,
          code: newProfile.code,
          sku: `SKU-${Math.floor(Math.random() * 10000)}`,
          date: dateStr,
          status: 'pending',
          notificationCount: 0,
          isMyTask: true,
          type: 'folder'
      };

      setTasks([newTask, ...tasks]);
      setIsCreateModalOpen(false);
      setNewProfile({ sender: '', title: '', code: '' });
      setSelectedTask(newTask);
      setSearchTerm('');
  };

  // View: CHAT DETAIL
  if (selectedTask) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-[#0060AF] text-white p-4 flex items-center justify-between shadow-md">
           <div className="flex items-center gap-3 overflow-hidden">
             <button onClick={() => setSelectedTask(null)} className="p-1 hover:bg-white/10 rounded">
                <ArrowLeft size={24} />
             </button>
             <div className="flex flex-col overflow-hidden">
                <h2 className="font-bold text-sm truncate w-full">{selectedTask.title}</h2>
                <div className="flex text-[10px] gap-2 opacity-80">
                   <span className="bg-white/20 px-1 rounded">{selectedTask.sku}</span>
                   <span className="text-blue-200">{selectedTask.code}</span>
                </div>
             </div>
           </div>
           <button onClick={() => setSelectedTask(null)} className="bg-red-50 text-red-500 text-xs px-2 py-1 rounded border border-red-100">
             Thoát
           </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           {messages.map((msg) => (
             <div key={msg.id} className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <img src={msg.avatar} className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" alt={msg.sender} />
                
                <div className={`max-w-[80%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                   {!msg.isMe && <span className="text-[10px] text-gray-500 ml-1 mb-0.5">{msg.sender}</span>}
                   
                   <div className={`p-3 rounded-xl text-sm shadow-sm ${
                      msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                   }`}>
                      {msg.text && <p className="mb-1">{msg.text}</p>}
                      
                      {/* Backward Compatibility for single image */}
                      {msg.image && (
                        <img 
                            src={msg.image} 
                            onClick={() => setViewImage(msg.image!)}
                            className="mt-1 rounded-lg max-w-full h-auto border border-black/10 cursor-zoom-in" 
                            alt="attachment" 
                        />
                      )}

                      {/* Multiple Images Grid */}
                      {msg.images && msg.images.length > 0 && (
                          <div className={`grid gap-1 mt-1 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {msg.images.map((img, idx) => (
                                  <img 
                                    key={idx}
                                    src={img}
                                    onClick={() => setViewImage(img)}
                                    className="rounded-lg w-full h-24 object-cover border border-black/10 cursor-zoom-in"
                                    alt={`img-${idx}`}
                                  />
                              ))}
                          </div>
                      )}
                   </div>
                   
                   <span className="text-[9px] text-gray-400 mt-1 mx-1">{msg.timestamp}</span>
                </div>
             </div>
           ))}
        </div>

        {/* Input Area */}
        <div className="bg-white p-3 border-t border-gray-200 flex items-center gap-3">
           <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleSendMessage} // Auto send on select for simplicity or handle state to show preview
           />
           <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 p-2 hover:bg-gray-100 rounded-full"
           >
              <ImageIcon size={24} />
           </button>
           <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập... (Gõ 'TCKT:' để lưu kỹ thuật)" 
                className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400"
              />
           </div>
           <button 
             onClick={handleSendMessage}
             className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/30"
           >
              <Send size={18} />
           </button>
        </div>

        {/* Full Screen Image Viewer Modal */}
        {viewImage && (
            <ImageViewer src={viewImage} onClose={() => setViewImage(null)} />
        )}
      </div>
    );
  }

  // View: HOME / LIST
  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Header */}
      <div className="bg-[#0060AF] text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
           <div className="flex items-center gap-2">
             <div className="bg-white/20 p-1.5 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/><line x1="3.27" y1="6.96" x2="12" y2="12.01"/><line x1="12" y1="12.01" x2="20.73" y2="6.96"/></svg>
             </div>
             <span className="font-bold text-lg uppercase">PHẢN ỨNG NHANH</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                 {user.name} <span className="bg-yellow-400 text-[#0060AF] px-1 rounded text-[10px] font-bold">{user.department || 'IN'}</span>
              </div>
              <button onClick={onLogout} className="p-1 hover:bg-white/10 rounded">
                 <LogOut size={20} />
              </button>
           </div>
        </div>

        {/* Search */}
        <div className="relative">
           <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
           <input 
             type="text" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             placeholder="Nhập Mã phiếu / Tên..." 
             className="w-full bg-[#F3F4F6] text-gray-800 placeholder-gray-500 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none"
           />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
         <button 
           onClick={() => setActiveTab('MY_ITEMS')}
           className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 relative ${
             activeTab === 'MY_ITEMS' ? 'text-blue-600' : 'text-gray-500'
           }`}
         >
           <span className="text-blue-600">@</span> Của tôi
           <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">2</span>
           {activeTab === 'MY_ITEMS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
         </button>
         <button 
           onClick={() => setActiveTab('ALL')}
           className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 relative ${
             activeTab === 'ALL' ? 'text-blue-600' : 'text-gray-500'
           }`}
         >
           <Folder size={16} /> Tất cả
           {activeTab === 'ALL' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
         </button>
      </div>

      {/* Date Filters */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
         <button className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">Hôm nay</button>
         <button className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">3 ngày qua</button>
         <button className="whitespace-nowrap px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">7 ngày qua</button>
         <button className="whitespace-nowrap px-3 py-1 rounded-full bg-[#1F2937] text-white text-xs font-medium">Toàn bộ</button>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-3 space-y-3 pb-20">
         {activeTab === 'ALL' && (
             <div className="flex items-center gap-2 mb-2">
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{displayTasks.length}</span>
                <span className="text-xs font-bold text-gray-500 uppercase">DANH SÁCH HỒ SƠ</span>
             </div>
         )}
         
         {displayTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
                <Search size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Không tìm thấy hồ sơ nào.</p>
                <p className="text-xs">Nhấn nút + bên dưới để tạo phiếu mới.</p>
            </div>
         ) : (
            displayTasks.map((task) => (
            <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-start gap-3 active:scale-[0.98] transition-transform"
            >
                <div className="relative">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                        <Folder size={20} />
                    </div>
                    {task.notificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {task.notificationCount}
                    </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            {task.sender && <span className="text-[10px] font-bold text-gray-500 uppercase">{task.sender}</span>}
                            <h3 className="font-bold text-gray-800 text-sm truncate pr-2">{task.title}</h3>
                        </div>
                        {task.isMyTask && <span className="text-orange-500 bg-orange-50 rounded-full p-0.5"><span className="text-[10px] font-bold px-1">@</span></span>}
                    </div>
                    
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{task.sku}</span>
                    </div>
                    
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500">
                        <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock size={10} /> {task.date}</span>
                        <span className="text-blue-600 font-medium">{task.code}</span>
                        </div>
                        {task.status === 'completed' && <Check size={14} className="text-green-500" />}
                    </div>
                </div>
            </div>
            ))
         )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsCreateModalOpen(true)}
        className="absolute bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 z-20"
        title="Tạo phiếu mới"
      >
        <Plus size={32} />
      </button>

      {/* CREATE NEW PROFILE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-blue-700">Thêm Hồ Sơ Mới</h2>
                    <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-full bg-gray-100 text-gray-500">
                        <X size={20}/>
                    </button>
                </div>

                <form onSubmit={handleSaveNewProfile} className="space-y-4">
                    <div className="text-xs text-gray-500 font-mono mb-2">
                        STT: <span className="font-bold text-black">#{tasks.length + 1}</span> (Tự động)
                    </div>

                    {/* UPDATED LABELS: Removed (Mục lớn), (Mục con) text */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Khách hàng</label>
                        <input 
                            list="senders-list"
                            type="text"
                            required
                            value={newProfile.sender}
                            onChange={(e) => setNewProfile({...newProfile, sender: e.target.value})}
                            placeholder="Chọn hoặc nhập tên khách hàng..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <datalist id="senders-list">
                            {uniqueSenders.map((sender, idx) => (
                                <option key={idx} value={sender} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tên sản phẩm</label>
                        <input 
                            type="text"
                            required
                            value={newProfile.title}
                            onChange={(e) => setNewProfile({...newProfile, title: e.target.value})}
                            placeholder="Nhập tên sản phẩm..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                     <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phiếu Sản Xuất (PO)</label>
                        <input 
                            type="text"
                            required
                            value={newProfile.code}
                            onChange={(e) => setNewProfile({...newProfile, code: e.target.value})}
                            placeholder="Nhập mã phiếu SX..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center text-xs text-gray-600 mt-2">
                         <div className="flex items-center gap-1">
                             <Calendar size={14}/> {new Date().toLocaleDateString('en-GB')}
                         </div>
                         <div className="flex items-center gap-1 font-bold text-blue-600">
                             <User size={14}/> {user.name}
                         </div>
                    </div>

                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all mt-4"
                    >
                        Tạo Hồ Sơ Mới
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default MobileUserView;
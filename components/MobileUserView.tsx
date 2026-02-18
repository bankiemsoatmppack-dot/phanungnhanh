
import React, { useState, useEffect, useRef } from 'react';
import { User as AppUser, MobileTask, ChatMessage, Document, Announcement } from '../types';
import { MOCK_MOBILE_CHAT } from '../constants';
import ImageViewer from './ImageViewer';
import { compressImage, sendBrowserNotification } from '../utils';
import { LogOut, Search, Folder, Clock, Check, ArrowLeft, Image as ImageIcon, Send, Plus, X, Calendar, User, ChevronDown, Layers, FilePlus, Lock, Key, Bell, CheckCircle } from 'lucide-react';
import { saveChatToSheet, assignSlotForNewDocument } from '../services/storageService';

interface Props {
  user: AppUser;
  onLogout: () => void;
  documents: Document[]; // Receive from App
  onAddDocument: (doc: Document) => void; // Sync back to App
  onUpdateDocument: (doc: Document) => void; // Sync updates
  
  // NEW: Props for Announcements
  announcements: Announcement[];
  onMarkAnnouncementAsRead: (id: string) => void;
}

const MobileUserView: React.FC<Props> = ({ user, onLogout, documents, onAddDocument, onUpdateDocument, announcements, onMarkAnnouncementAsRead }) => {
  const [activeTab, setActiveTab] = useState<'MY_ITEMS' | 'ALL'>('MY_ITEMS');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // PO Management State
  const [showPOSwitcher, setShowPOSwitcher] = useState(false);
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [newPOValue, setNewPOValue] = useState('');

  // Password Change State
  const [isChangePassModalOpen, setIsChangePassModalOpen] = useState(false);
  const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' });

  // Notifications Modal State
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal State (Create New Profile)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({
      sender: '', // Mục lớn
      title: '', // Mục con
      code: '', // Phiếu SX
  });

  // Derived: Unread Announcements Count
  const unreadAnnouncementsCount = announcements.filter(a => !a.readBy.includes(user.id)).length;

  // Derived selected document
  const selectedDoc = documents.find(d => d.id === selectedDocId) || null;
  const messages = selectedDoc?.messages || []; // Use messages from the specific document

  // Find related POs for the current selected document
  const relatedPOs = selectedDoc 
    ? documents.filter(d => d.sender === selectedDoc.sender && d.title === selectedDoc.title)
    : [];

  // Request Notification Permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
  }, []);

  // Map Documents to MobileTasks interface for display
  const tasks: MobileTask[] = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      sender: doc.sender,
      sku: doc.code,
      code: doc.productionOrder || doc.code,
      date: doc.date,
      status: doc.status === 'approved' ? 'completed' : 'pending',
      notificationCount: (doc.approvalItems || []).filter(i => i.status === 'pending').length,
      isMyTask: true, // For demo, assume all are visible/assigned
      type: 'folder'
  }));

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
     // Parse date DD/MM/YYYY
     const [dayA, monthA, yearA] = a.date.split('/');
     const [dayB, monthB, yearB] = b.date.split('/');
     const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
     const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
     return dateB.getTime() - dateA.getTime();
  });

  const uniqueSenders = Array.from(new Set(tasks.map(t => t.sender).filter(Boolean))) as string[];

  // ... (Chat and PO handlers remain same) ...
  const handleSendMessage = async () => {
    if (!selectedDoc) return;
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
        fileInputRef.current.value = '';
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: user.name, // Use actual logged in user name
      role: user.role === 'ADMIN' ? 'Quản lý' : 'Bạn',
      department: user.department || 'SX',
      avatar: '', // Removed Avatar
      text: chatMessage,
      images: images,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      isMe: true
    };
    
    // Update the document with new message
    const updatedMessages = [...(selectedDoc.messages || []), newMessage];
    onUpdateDocument({ ...selectedDoc, messages: updatedMessages });
    
    setChatMessage('');
    
    // Sync to Sheet (Pass the full document for routing)
    saveChatToSheet(newMessage, selectedDoc);
  };

  const handleCreatePO = () => {
    if (!selectedDoc || !newPOValue.trim()) return;

    const assignedSlotId = assignSlotForNewDocument();
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;

    const newDoc: Document = {
        ...selectedDoc, // Clone basic info
        id: Date.now().toString(),
        productionOrder: newPOValue, // New PO
        date: dateStr,
        status: 'processing',
        messages: [], // Clear chat
        approvalItems: [], // Clear approvals
        defects: [], // Clear defects
        specLogs: [],
        storageSlotId: assignedSlotId // Assign new slot if needed or inherit logic
    };

    onAddDocument(newDoc);
    setSelectedDocId(newDoc.id); // Switch to new doc
    setIsNewPOModalOpen(false);
    setShowPOSwitcher(false);
    setNewPOValue('');
    alert(`Đã tạo phiếu SX mới: ${newPOValue}`);
};

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Đổi mật khẩu thành công!");
      setIsChangePassModalOpen(false);
      setPassData({ oldPass: '', newPass: '', confirmPass: '' });
  };

  const handleSaveNewProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProfile.sender || !newProfile.title || !newProfile.code) {
          alert("Vui lòng nhập đầy đủ thông tin!");
          return;
      }

      const assignedSlotId = assignSlotForNewDocument();
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;

      const newDoc: Document = {
          id: Date.now().toString(),
          title: newProfile.title,
          code: `SKU-${Math.floor(Math.random() * 10000)}`,
          productionOrder: newProfile.code,
          date: dateStr,
          sender: newProfile.sender,
          status: 'processing',
          urgency: 'normal',
          type: 'incoming',
          abstract: 'Hồ sơ mới tạo từ Mobile App',
          department: user.department || 'SX',
          handler: user.name,
          specs: undefined,
          defects: [],
          specLogs: [],
          approvalItems: [],
          messages: [],
          storageSlotId: assignedSlotId
      };

      onAddDocument(newDoc);
      setIsCreateModalOpen(false);
      setNewProfile({ sender: '', title: '', code: '' });
      setSelectedDocId(newDoc.id);
      setSearchTerm('');
  };

  // View: CHAT DETAIL
  if (selectedDoc) {
     return (
        <div className="flex flex-col h-[100dvh] bg-gray-100">
             {/* Header */}
            <div className="bg-[#0060AF] text-white pt-4 pb-2 px-4 shadow-md z-20">
            {/* ... (Header Content) ... */}
            <div className="flex items-center justify-between mb-2">
                <button onClick={() => setSelectedDocId(null)} className="p-1 hover:bg-white/10 rounded">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-center max-w-[70%]">
                    <h2 className="font-bold text-sm truncate w-full text-center">{selectedDoc.title}</h2>
                    <span className="text-[10px] opacity-80">{selectedDoc.sender}</span>
                </div>
                <button onClick={() => setSelectedDocId(null)} className="bg-red-50 text-red-500 text-xs px-2 py-1 rounded border border-red-100">
                    Thoát
                </button>
            </div>
            
            <div className="relative">
                <button 
                    onClick={() => setShowPOSwitcher(!showPOSwitcher)}
                    className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-2 flex items-center justify-between transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Layers size={16} className="text-yellow-400"/>
                        <div className="flex flex-col items-start">
                            <span className="text-[9px] uppercase opacity-70">Phiếu Sản Xuất</span>
                            <span className="text-sm font-bold text-yellow-100">{selectedDoc.productionOrder || 'Chưa có PO'}</span>
                        </div>
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${showPOSwitcher ? 'rotate-180' : ''}`}/>
                </button>

                {showPOSwitcher && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200 origin-top">
                        <div className="max-h-60 overflow-y-auto">
                            {relatedPOs.map(po => (
                                <button 
                                    key={po.id}
                                    onClick={() => { setSelectedDocId(po.id); setShowPOSwitcher(false); }}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-100 flex items-center justify-between ${po.id === selectedDocId ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <div className="text-xs">{po.productionOrder || 'No Code'}</div>
                                        <div className="text-[9px] text-gray-500">{po.date}</div>
                                    </div>
                                    {po.id === selectedDocId && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setIsNewPOModalOpen(true)}
                            className="w-full p-3 bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700"
                        >
                            <Plus size={14}/> Tạo Phiếu SX Mới
                        </button>
                    </div>
                )}
            </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm italic">
                    Chưa có tin nhắn nào cho <strong>{selectedDoc.productionOrder}</strong>. <br/>
                    Hãy bắt đầu trao đổi hoặc chụp ảnh lỗi.
                </div>
            ) : (
                messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Removed Avatar, Using Name Text instead */}
                        <div className={`max-w-[80%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                        <span className={`text-[11px] font-bold ml-1 mb-0.5 ${msg.isMe ? 'text-blue-700' : 'text-gray-700'}`}>
                            {msg.sender}
                        </span>
                        
                        <div className={`p-3 rounded-xl text-sm shadow-sm ${
                            msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                        }`}>
                            {msg.text && <p className="mb-1">{msg.text}</p>}
                            
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
                            {msg.image && (
                                <img 
                                    src={msg.image} 
                                    onClick={() => setViewImage(msg.image!)}
                                    className="mt-1 rounded-lg max-w-full h-auto border border-black/10 cursor-zoom-in" 
                                    alt="attachment" 
                                />
                            )}
                        </div>
                        
                        <span className="text-[9px] text-gray-400 mt-1 mx-1">{msg.timestamp}</span>
                        </div>
                    </div>
                ))
            )}
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 pb-8 border-t border-gray-200 flex items-center gap-3">
            <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleSendMessage} 
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

             {/* New PO Modal */}
            {isNewPOModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    {/* ... (Existing PO Modal) ... */}
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 p-4 text-white">
                            <h3 className="font-bold">Thêm Phiếu SX Mới</h3>
                            <p className="text-xs opacity-80 mt-1">{selectedDoc.title}</p>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mã Phiếu SX</label>
                                <input 
                                    type="text" 
                                    value={newPOValue}
                                    onChange={(e) => setNewPOValue(e.target.value)}
                                    placeholder="VD: PO-2024-001"
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsNewPOModalOpen(false)} className="flex-1 py-2 text-sm text-gray-600 font-bold bg-gray-100 rounded hover:bg-gray-200">Hủy</button>
                                <button onClick={handleCreatePO} className="flex-1 py-2 text-sm text-white font-bold bg-blue-600 rounded hover:bg-blue-700">Tạo mới</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {viewImage && (
                <ImageViewer src={viewImage} onClose={() => setViewImage(null)} />
            )}
        </div>
     );
  }

  // View: HOME / LIST
  return (
    <div className="flex flex-col h-[100dvh] bg-white relative">
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
              {/* NOTIFICATION BELL */}
              <button 
                 onClick={() => setIsNotifModalOpen(true)}
                 className="relative bg-white/20 p-1.5 rounded-full active:scale-95 transition-transform"
              >
                 <Bell size={18} />
                 {unreadAnnouncementsCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                         {unreadAnnouncementsCount}
                     </span>
                 )}
              </button>

              <button 
                onClick={() => setIsChangePassModalOpen(true)}
                className="bg-white/20 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 active:scale-95 transition-transform"
                title="Đổi mật khẩu"
              >
                 {user.name} <span className="bg-yellow-400 text-[#0060AF] px-1 rounded text-[10px] font-bold">{user.department || 'IN'}</span>
              </button>
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
      
      {/* ... (Existing List Content and Logic) ... */}
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
                onClick={() => setSelectedDocId(task.id)}
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
        className="absolute bottom-10 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 z-20"
        title="Tạo phiếu mới"
      >
        <Plus size={32} />
      </button>

      {/* NOTIFICATIONS MODAL (Mobile User) */}
      {isNotifModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
                  <div className="bg-[#0060AF] p-4 text-white rounded-t-xl flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-2 font-bold">
                          <Bell size={20}/> Thông Báo & Tin Tức
                      </div>
                      <button onClick={() => setIsNotifModalOpen(false)}><X size={20}/></button>
                  </div>
                  <div className="p-4 overflow-y-auto space-y-3 bg-gray-50 flex-1">
                      {announcements.length === 0 ? (
                          <div className="text-center text-gray-400 py-6">Chưa có thông báo mới</div>
                      ) : (
                          announcements.map(ann => {
                              const isRead = ann.readBy.includes(user.id);
                              return (
                                  <div 
                                    key={ann.id} 
                                    onClick={() => !isRead && onMarkAnnouncementAsRead(ann.id)}
                                    className={`bg-white p-3 rounded-lg border shadow-sm ${!isRead ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100'}`}
                                  >
                                      <div className="flex justify-between items-start mb-1">
                                          <h4 className={`font-bold text-sm ${isRead ? 'text-gray-700' : 'text-blue-700'}`}>{ann.title}</h4>
                                          {!isRead && <span className="text-[9px] bg-red-500 text-white px-1.5 rounded-full animate-pulse">Mới</span>}
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2 whitespace-pre-wrap">{ann.content}</p>
                                      <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[10px] text-gray-400">
                                          <span>{ann.date} • {ann.author}</span>
                                          {isRead ? <CheckCircle size={12} className="text-green-500"/> : <span className="text-blue-500 cursor-pointer" onClick={() => onMarkAnnouncementAsRead(ann.id)}>Đánh dấu đã đọc</span>}
                                      </div>
                                  </div>
                              )
                          })
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isChangePassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs">
                 <div className="bg-blue-600 p-4 text-white rounded-t-xl flex justify-between items-center">
                     <h3 className="font-bold">Đổi Mật Khẩu</h3>
                     <button onClick={() => setIsChangePassModalOpen(false)}><X size={18}/></button>
                 </div>
                 <form onSubmit={handleChangePassword} className="p-4 space-y-3">
                     <div>
                         <label className="text-xs font-bold text-gray-500 block mb-1">Mật khẩu cũ</label>
                         <input type="password" value={passData.oldPass} onChange={e => setPassData({...passData, oldPass: e.target.value})} className="w-full border rounded px-3 py-2 text-sm"/>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-500 block mb-1">Mật khẩu mới</label>
                         <input type="password" value={passData.newPass} onChange={e => setPassData({...passData, newPass: e.target.value})} className="w-full border rounded px-3 py-2 text-sm"/>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-500 block mb-1">Xác nhận mật khẩu</label>
                         <input type="password" value={passData.confirmPass} onChange={e => setPassData({...passData, confirmPass: e.target.value})} className="w-full border rounded px-3 py-2 text-sm"/>
                     </div>
                     <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg mt-2">Xác nhận</button>
                 </form>
             </div>
          </div>
      )}

      {/* CREATE NEW PROFILE MODAL (Existing) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
             {/* ... (Existing modal content) ... */}
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

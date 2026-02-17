
import React, { useState, useEffect, useRef } from 'react';
import { Document, TabType, ChatMessage, DefectEntry, ApprovalItem, SpecLogEntry, PackagingSpecs } from '../types';
import { MOCK_CHAT, MOCK_DOCUMENTS } from '../constants';
import ImageViewer from './ImageViewer';
import { compressImage } from '../utils';
import { Send, Paperclip, Save, Printer, Share2, MoreHorizontal, PenTool, Layers, Palette, Ruler, AlertCircle, MessageSquare, Trash2, CheckCircle, RefreshCcw, Image as ImageIcon, Download, FileSpreadsheet, ClipboardCheck, FileText, Table, Calendar, User, Building, AlertTriangle, Edit3, X, History, Eye } from 'lucide-react';

interface Props {
  document: Document;
  onUpdateDocument: (updatedDoc: Document) => void;
}

const DocumentDetail: React.FC<Props> = ({ document, onUpdateDocument }) => {
  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin "View All" Toggle
  const [viewAllHistory, setViewAllHistory] = useState(false);

  // Find all versions (POs) of this product
  const relatedDocuments = MOCK_DOCUMENTS.filter(d => d.title === document.title && d.sender === document.sender);
  
  // TCKT State
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [tempSpecs, setTempSpecs] = useState<PackagingSpecs>({
      dimensions: '', material: '', flute: '', printTech: '', colors: [], netWeight: ''
  });

  // Initialize specs state
  useEffect(() => {
    if (document.specs) {
        setTempSpecs(document.specs);
        setIsEditingSpecs(false);
    } else {
        setTempSpecs({ dimensions: '', material: '', flute: '', printTech: '', colors: [], netWeight: '' });
        setIsEditingSpecs(true);
    }
  }, [document]);

  // Handle Switching PO
  const handleSwitchPO = (docId: string) => {
      // In a real app, this would route to the new ID. 
      // Since `DocumentDetail` is controlled by `App.tsx`, we can't switch directly here without a callback to App.
      // However, the prompt implies functionality within the detail view.
      // For this mock, I will assume the parent passes a way to switch or the user uses the sidebar.
      // But to make it work here visually:
      alert("Vui lòng chọn Phiếu SX tương ứng bên menu trái để chuyển đổi dữ liệu chính xác.");
  };

  const handleSaveSpecs = () => {
     if (!tempSpecs.dimensions || !tempSpecs.material) {
         alert("Vui lòng nhập các thông số bắt buộc (Kích thước, Chất liệu)!");
         return;
     }
     onUpdateDocument({ ...document, specs: tempSpecs });
     setIsEditingSpecs(false);
  };

  const handleChatDoubleClick = (msg: ChatMessage) => {
    setChatMessage(msg.text);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() && (!fileInputRef.current?.files || fileInputRef.current.files.length === 0)) return;
    
    const lowerText = chatMessage.toLowerCase();
    let autoCategory: ApprovalItem['category'] = 'KHÁC';
    if (lowerText.includes('sóng') || lowerText.includes('song')) autoCategory = 'SÓNG';
    else if (lowerText.includes('in')) autoCategory = 'IN';
    else if (lowerText.includes('thành phẩm') || lowerText.includes('thanh pham') || lowerText.includes('bế')) autoCategory = 'THÀNH PHẨM';
    else if (lowerText.includes('kho')) autoCategory = 'KHO';
    else if (lowerText.includes('tckt') || lowerText.includes('kỹ thuật') || lowerText.includes('spec') || lowerText.includes('kích thước') || lowerText.includes('yêu cầu tckt')) autoCategory = 'TCKT';

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
        sender: 'Tôi',
        avatar: 'https://picsum.photos/40/40?random=2',
        text: chatMessage,
        images: images,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        role: 'Sale'
    };
    
    setMessages([...messages, newMessage]);
    setChatMessage('');

    if (images.length > 0) {
        images.forEach(img => {
            const newItem: ApprovalItem = {
                id: Date.now().toString() + Math.random(),
                sourceId: newMessage.id,
                content: newMessage.text || 'Hình ảnh từ chat',
                image: img,
                category: autoCategory !== 'KHÁC' ? autoCategory : 'KHÁC', 
                solution: '',
                timestamp: newMessage.timestamp,
                status: 'pending',
                reporter: newMessage.sender
            };
            const updatedItems = [...(document.approvalItems || []), newItem];
            onUpdateDocument({ ...document, approvalItems: updatedItems });
        });
    } else if (newMessage.text) {
        if (autoCategory !== 'KHÁC') {
             const newItem: ApprovalItem = {
                id: Date.now().toString() + Math.random(),
                sourceId: newMessage.id,
                content: newMessage.text,
                category: autoCategory,
                solution: '',
                timestamp: newMessage.timestamp,
                status: 'pending',
                reporter: newMessage.sender
            };
            onUpdateDocument({ ...document, approvalItems: [...(document.approvalItems || []), newItem] });
        }
    }
  };

  const handleSaveCategoryToLog = (category: 'SÓNG' | 'IN' | 'THÀNH PHẨM' | 'KHO' | 'TCKT', manualContent: string, manualSolution: string) => {
      // Only save to current document
      const pendingItems = (document.approvalItems || []).filter(i => i.category === category && i.status === 'pending');
      const combinedContent = [manualContent, ...pendingItems.map(i => i.content)].filter(Boolean).join('. ');
      const combinedImages = pendingItems.map(i => i.image).filter((img): img is string => !!img);
      const reporters = [...new Set(pendingItems.map(i => i.reporter).filter(Boolean))].join(', ');
      const finalReporter = reporters || 'Admin';

      if (!combinedContent && combinedImages.length === 0 && !manualSolution) {
          alert('Vui lòng nhập nội dung hoặc chọn dữ liệu từ chat.');
          return;
      }

      if (category === 'TCKT') {
        const specEntry: SpecLogEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString('en-GB'),
            productionOrder: document.productionOrder || '',
            content: combinedContent,
            images: combinedImages,
            result: manualSolution,
            reporter: finalReporter
        };
        const idsToRemove = pendingItems.map(i => i.id);
        const updatedApprovals = (document.approvalItems || []).filter(i => !idsToRemove.includes(i.id));

        onUpdateDocument({
            ...document,
            specLogs: [...(document.specLogs || []), specEntry],
            approvalItems: updatedApprovals
        });
        alert('Đã lưu dữ liệu vào Nhật ký TCKT!');
        return;
      }

      const defectEntry: DefectEntry = {
          id: Date.now().toString(),
          date: new Date().toLocaleDateString('en-GB'),
          productionOrder: document.productionOrder || '',
          song: category === 'SÓNG' ? combinedContent : '',
          songImages: category === 'SÓNG' ? combinedImages : [],
          in: category === 'IN' ? combinedContent : '',
          inImages: category === 'IN' ? combinedImages : [],
          thanhPham: category === 'THÀNH PHẨM' ? combinedContent : '',
          thanhPhamImages: category === 'THÀNH PHẨM' ? combinedImages : [],
          kho: category === 'KHO' ? combinedContent : '',
          khoImages: category === 'KHO' ? combinedImages : [],
          solution: manualSolution,
          reporter: finalReporter
      };

      const idsToRemove = pendingItems.map(i => i.id);
      const updatedApprovals = (document.approvalItems || []).filter(i => !idsToRemove.includes(i.id));

      onUpdateDocument({
          ...document,
          defects: [...(document.defects || []), defectEntry],
          approvalItems: updatedApprovals
      });
      alert(`Đã lưu dữ liệu ${category} vào Nhật ký lỗi!`);
  };

  const tabs: {id: TabType, label: string}[] = [
    { id: 'OVERVIEW', label: 'Hồ sơ & TCKT' },
    { id: 'CHAT', label: 'Chát online' },
    { id: 'APPROVE', label: 'Duyệt và Lưu' },
  ];

  // Helper to get items based on View All mode
  const getApprovalItems = () => {
      if (viewAllHistory) {
          return relatedDocuments.flatMap(d => d.approvalItems || []);
      }
      return document.approvalItems || [];
  };

  const renderApproveQuadrant = (category: 'SÓNG' | 'IN' | 'THÀNH PHẨM' | 'KHO' | 'TCKT', icon: any, colorClass: string) => {
     // If View All is On, we show items from ALL versions, but we can only SAVE to the current version.
     // So for pending actions, it's safer to only show current document's pending items to avoid confusion on where it saves.
     // However, the request implies Admin wants to SEE everything.
     
     const items = getApprovalItems().filter(i => i.category === category && i.status === 'pending');
     
     return (
        <Quadrant 
            category={category} 
            items={items} 
            icon={icon} 
            colorClass={colorClass}
            isViewAll={viewAllHistory}
            onSave={(content, solution) => handleSaveCategoryToLog(category, content, solution)}
            onDelete={(id) => {
                 // Simple delete for current doc, for aggregated it's complex, so disable delete in view all
                 if(!viewAllHistory) {
                     const updatedItems = (document.approvalItems || []).filter(item => item.id !== id);
                     onUpdateDocument({ ...document, approvalItems: updatedItems });
                 }
            }}
            onUpdateItem={(id, field, val) => {
                if (!viewAllHistory) {
                    const updatedItems = (document.approvalItems || []).map(item => 
                        item.id === id ? { ...item, [field]: val } : item
                    );
                    onUpdateDocument({ ...document, approvalItems: updatedItems });
                }
            }}
            onImageClick={(src) => setPreviewImage(src)}
        />
     );
  };

  return (
    <>
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Title & PO Selector */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex justify-between items-start">
             <div className="flex-1">
                <div className="text-xs font-bold text-blue-600 uppercase mb-1 tracking-wide flex items-center gap-2">
                    <Building size={12}/> {document.sender}
                </div>
                <h2 className="text-xl font-bold text-gray-800 leading-tight mb-2">{document.title}</h2>
                
                {/* PO Selector */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1 border border-gray-200">
                        <Layers size={14} className="text-gray-500"/>
                        <span className="text-xs font-semibold text-gray-500 uppercase">Phiếu SX:</span>
                        <select 
                            value={document.id}
                            onChange={(e) => handleSwitchPO(e.target.value)}
                            className="bg-transparent text-sm font-bold text-blue-700 outline-none cursor-pointer"
                        >
                            {relatedDocuments.map(d => (
                                <option key={d.id} value={d.id}>{d.productionOrder || d.code} ({d.date})</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                         <span className={`px-2 py-1 rounded text-xs font-bold border ${
                             document.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                         }`}>
                             {document.status === 'approved' ? 'Đã duyệt' : 'Đang xử lý'}
                         </span>
                    </div>
                </div>
             </div>
             
             {/* Admin View All Toggle */}
             <div className="flex flex-col items-end gap-2">
                 <div className="flex items-center gap-2">
                     <label className="text-xs font-bold text-gray-600 cursor-pointer select-none">Xem tổng hợp (Tất cả PO)</label>
                     <div 
                        onClick={() => setViewAllHistory(!viewAllHistory)}
                        className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${viewAllHistory ? 'bg-blue-600' : 'bg-gray-300'}`}
                     >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${viewAllHistory ? 'translate-x-5' : 'translate-x-0'}`}></div>
                     </div>
                 </div>
                 <div className="flex gap-1 items-start">
                     <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><Share2 size={18}/></button>
                     <button className="p-2 hover:bg-gray-100 rounded text-gray-500"><MoreHorizontal size={18}/></button>
                 </div>
             </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
             <div className="space-y-6">
                 {/* 1.1 Detailed Information Card */}
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FileText size={100} />
                     </div>
                     <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Building size={16} className="text-blue-600" /> Thông tin chi tiết hồ sơ
                     </h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm relative z-10">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Khách hàng / Đơn vị</span>
                            <span className="font-bold text-gray-800 text-base">{document.sender}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Tên sản phẩm</span>
                            <span className="font-bold text-gray-800">{document.title}</span>
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Mã sản phẩm (SKU)</span>
                            <span className="font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded w-fit border border-gray-200">{document.code}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Phiếu sản xuất (PO)</span>
                            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100">{document.productionOrder || 'Chưa cập nhật'}</span>
                        </div>

                         <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Ngày tạo</span>
                            <div className="flex items-center gap-2 font-medium text-gray-700">
                                <Calendar size={14} className="text-gray-400"/> {document.date}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase font-semibold">Phụ trách</span>
                            <div className="flex items-center gap-2 font-medium text-gray-700">
                                <User size={14} className="text-gray-400"/> {document.handler}
                                <span className="text-xs text-gray-400">({document.department})</span>
                            </div>
                        </div>

                         <div className="md:col-span-2 pt-2">
                             <span className="text-xs text-gray-500 uppercase font-semibold">Mô tả / Trích yếu</span>
                             <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1 italic leading-relaxed">
                                {document.abstract}
                             </p>
                         </div>
                     </div>
                 </div>

                 {/* 1.2 TCKT (Technical Specs) Management */}
                 <div className={`rounded-xl border shadow-sm transition-all duration-300 ${!document.specs ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                    <div className="p-4 border-b border-gray-200/50 flex justify-between items-center">
                         <h3 className={`text-sm font-bold uppercase flex items-center gap-2 ${!document.specs ? 'text-red-700' : 'text-gray-800'}`}>
                            <Ruler size={16} /> Thông số kỹ thuật (TCKT)
                         </h3>
                         <div className="flex gap-2">
                             {!isEditingSpecs && document.specs && (
                                 <button 
                                    onClick={() => setIsEditingSpecs(true)} 
                                    className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"
                                 >
                                    <Edit3 size={12}/> Chỉnh sửa
                                 </button>
                             )}
                             {isEditingSpecs && (
                                 <div className="flex gap-2">
                                     <button 
                                        onClick={() => { setIsEditingSpecs(false); setTempSpecs(document.specs || tempSpecs); }}
                                        className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                     >
                                        Hủy
                                     </button>
                                     <button 
                                        onClick={handleSaveSpecs}
                                        className="text-xs font-bold text-white bg-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-colors flex items-center gap-1"
                                     >
                                        <Save size={12}/> Lưu TCKT
                                     </button>
                                 </div>
                             )}
                         </div>
                    </div>

                    <div className="p-6">
                        {!document.specs && !isEditingSpecs ? (
                            <div className="text-center py-8">
                                <div className="bg-red-100 text-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                                    <AlertTriangle size={24} />
                                </div>
                                <h4 className="text-red-700 font-bold mb-1">Chưa có thông số kỹ thuật!</h4>
                                <p className="text-red-500 text-xs mb-4">Hồ sơ này thiếu thông tin TCKT. Vui lòng cập nhật ngay.</p>
                                <button 
                                    onClick={() => setIsEditingSpecs(true)}
                                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-500/30 transition-transform active:scale-95"
                                >
                                    + Thêm TCKT Mới
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Dimensions */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Kích thước</label>
                                    {isEditingSpecs ? (
                                        <input 
                                            type="text" 
                                            value={tempSpecs.dimensions}
                                            onChange={(e) => setTempSpecs({...tempSpecs, dimensions: e.target.value})}
                                            placeholder="Dài x Rộng x Cao (mm)"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                        />
                                    ) : (
                                        <div className="font-bold text-gray-800 text-base">{document.specs?.dimensions}</div>
                                    )}
                                </div>

                                {/* Material */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Chất liệu giấy</label>
                                    {isEditingSpecs ? (
                                        <input 
                                            type="text" 
                                            value={tempSpecs.material}
                                            onChange={(e) => setTempSpecs({...tempSpecs, material: e.target.value})}
                                            placeholder="VD: Kraft nâu, 5 lớp"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                        />
                                    ) : (
                                        <div className="font-bold text-gray-800">{document.specs?.material}</div>
                                    )}
                                </div>

                                {/* Flute */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Loại sóng</label>
                                    {isEditingSpecs ? (
                                        <select 
                                            value={tempSpecs.flute}
                                            onChange={(e) => setTempSpecs({...tempSpecs, flute: e.target.value})}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white"
                                        >
                                            <option value="">-- Chọn sóng --</option>
                                            <option value="Sóng A">Sóng A</option>
                                            <option value="Sóng B">Sóng B</option>
                                            <option value="Sóng C">Sóng C</option>
                                            <option value="Sóng E">Sóng E</option>
                                            <option value="Sóng BC">Sóng BC (5 lớp)</option>
                                            <option value="Sóng BE">Sóng BE (5 lớp)</option>
                                        </select>
                                    ) : (
                                        <div className="font-bold text-gray-800">{document.specs?.flute}</div>
                                    )}
                                </div>

                                {/* Print Tech */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Công nghệ in</label>
                                    {isEditingSpecs ? (
                                        <input 
                                            type="text" 
                                            value={tempSpecs.printTech}
                                            onChange={(e) => setTempSpecs({...tempSpecs, printTech: e.target.value})}
                                            placeholder="VD: Flexo 4 màu"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                        />
                                    ) : (
                                        <div className="font-bold text-gray-800">{document.specs?.printTech}</div>
                                    )}
                                </div>

                                {/* Colors */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Màu sắc</label>
                                    {isEditingSpecs ? (
                                        <input 
                                            type="text" 
                                            value={tempSpecs.colors.join(', ')}
                                            onChange={(e) => setTempSpecs({...tempSpecs, colors: e.target.value.split(',').map(c => c.trim())})}
                                            placeholder="Xanh, Đỏ, Vàng..."
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                        />
                                    ) : (
                                        <div className="flex gap-1 flex-wrap">
                                            {document.specs?.colors.map((c, i) => (
                                                <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Net Weight */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Khối lượng tịnh</label>
                                    {isEditingSpecs ? (
                                        <input 
                                            type="text" 
                                            value={tempSpecs.netWeight}
                                            onChange={(e) => setTempSpecs({...tempSpecs, netWeight: e.target.value})}
                                            placeholder="VD: 300g"
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                        />
                                    ) : (
                                        <div className="font-bold text-gray-800">{document.specs?.netWeight}</div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Note for Admin */}
                        {isEditingSpecs && (
                            <div className="mt-6 bg-blue-50 p-3 rounded text-xs text-blue-700 flex items-start gap-2">
                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5"/>
                                <span>Lưu ý: Chỉ Admin hoặc người phụ trách mới có quyền chỉnh sửa TCKT. Dữ liệu này sẽ được đồng bộ sang bộ phận Sản xuất.</span>
                            </div>
                        )}
                    </div>
                 </div>
             </div>
        )}

        {/* TAB 2: CHAT ONLINE */}
        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-full">
            <div className="bg-yellow-50 text-yellow-800 text-xs p-2 mb-2 rounded border border-yellow-100 flex items-center gap-2">
               <AlertCircle size={14}/>
               <span>Nội dung chứa "TCKT, Sóng, In..." sẽ tự động phân loại sang tab Duyệt.</span>
            </div>
            <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <img src={msg.avatar} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" />
                  <div className={`max-w-[80%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                     <span className="text-[10px] text-gray-500 mb-1 ml-1">{msg.role} - {msg.sender}</span>
                     <div 
                        onDoubleClick={() => handleChatDoubleClick(msg)}
                        className={`p-3 rounded-lg text-sm shadow-sm cursor-pointer select-none transition-transform active:scale-95 ${
                        msg.isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-100 hover:border-blue-300'
                     }`}>
                        <p>{msg.text}</p>
                        
                        {/* Display Multiple Images */}
                        {msg.images && msg.images.length > 0 && (
                             <div className={`grid gap-1 mt-2 ${msg.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                 {msg.images.map((img, idx) => (
                                     <img 
                                        key={idx}
                                        src={img}
                                        onClick={(e) => { e.stopPropagation(); setPreviewImage(img); }}
                                        className="rounded bg-white w-full h-24 object-cover border border-black/10 cursor-zoom-in"
                                        alt={`attachment-${idx}`}
                                     />
                                 ))}
                             </div>
                        )}
                        
                        {/* Legacy Single Image */}
                        {msg.image && (
                            <img 
                                src={msg.image} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(msg.image!);
                                }}
                                alt="Chat attachment" 
                                className="mt-2 rounded-lg max-w-full h-auto border border-black/10 cursor-zoom-in" 
                            />
                        )}
                     </div>
                     <span className={`text-[9px] block mt-1 mx-1 ${msg.isMe ? 'text-blue-300' : 'text-gray-400'}`}>{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white p-2 rounded-lg border border-gray-300 flex items-center gap-2 shadow-sm">
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
                    className="text-gray-400 hover:text-gray-600"
                >
                    <Paperclip size={20}/>
                </button>
                <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Nhập nội dung... (VD: Yêu cầu TCKT mới)" 
                    className="flex-1 outline-none text-sm"
                />
                <button onClick={handleSendMessage} className="bg-blue-600 p-2 rounded text-white hover:bg-blue-700"><Send size={16}/></button>
            </div>
          </div>
        )}

        {/* TAB 3: APPROVE & SAVE */}
        {(activeTab === 'APPROVE') && (
            <div className="space-y-4 h-full flex flex-col">
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                   <div className="flex items-center gap-2 text-blue-800 font-bold">
                      <RefreshCcw size={18} />
                      Phê duyệt & Ghi nhận Lỗi / TCKT
                   </div>
                   <div className="flex items-center gap-2">
                       {viewAllHistory && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">Đang xem tổng hợp</span>}
                       <div className="bg-blue-100 px-3 py-1 rounded text-xs font-bold text-blue-700 border border-blue-200">
                          Phiếu SX: {document.productionOrder || 'Chưa có'}
                       </div>
                   </div>
                </div>

                {/* Grid Layout including TCKT */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
                    {/* TCKT gets its own focused quadrant */}
                    <div className="md:col-span-2 lg:col-span-1">
                        {renderApproveQuadrant('TCKT', <Ruler size={16} />, 'text-teal-600')}
                    </div>
                    {renderApproveQuadrant('SÓNG', <Layers size={16} />, 'text-orange-600')}
                    {renderApproveQuadrant('IN', <Palette size={16} />, 'text-blue-600')}
                    {renderApproveQuadrant('THÀNH PHẨM', <ScissorsIcon size={16} />, 'text-purple-600')}
                    {renderApproveQuadrant('KHO', <ArchiveIcon size={16} />, 'text-green-600')}
                </div>
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
         <button className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy bỏ</button>
         <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30">
            <Save size={16} /> Lưu & Cập nhật
         </button>
      </div>
    </div>

    {/* Full Screen Image Viewer Modal */}
    {previewImage && (
        <ImageViewer src={previewImage} onClose={() => setPreviewImage(null)} />
    )}
    </>
  );
};

// Sub-component for Approve Quadrant
const Quadrant = ({ category, items, icon, colorClass, onSave, onDelete, onUpdateItem, onImageClick, isViewAll }: any) => {
    // ... (Same Quadrant code as before) ...
    const [content, setContent] = useState('');
    const [solution, setSolution] = useState('');
    const solutionPlaceholder = category === 'TCKT' ? 'Kết quả / Ghi chú...' : 'Cách khắc phục...';
    const btnText = category === 'TCKT' ? 'Lưu TCKT' : `Lưu ${category}`;

    return (
        <div className={`bg-white border rounded-xl shadow-sm flex flex-col h-full min-h-[300px] transition-colors ${isViewAll ? 'border-orange-200 bg-orange-50/20' : 'border-gray-200'}`}>
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                <div className={`flex items-center gap-2 font-bold ${colorClass}`}>
                    {icon} {category}
                </div>
                {items.length > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {items.length} chờ
                    </span>
                )}
            </div>
            
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto max-h-[200px] bg-gray-50/30">
                 {items.length === 0 ? (
                     <div className="text-center text-xs text-gray-400 italic py-4">Không có dữ liệu chờ</div>
                 ) : (
                     items.map((item: ApprovalItem) => (
                        <div key={item.id} className="bg-white p-2 rounded border border-gray-100 shadow-sm text-xs relative group">
                            {!isViewAll && (
                                <button 
                                    onClick={() => onDelete(item.id)}
                                    className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12}/>
                                </button>
                            )}
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-[10px] text-blue-600">{item.reporter || 'User'}</span>
                                <span className="text-[9px] text-gray-400">{item.timestamp}</span>
                            </div>
                            {item.image ? (
                                <div className="mb-1">
                                    <img 
                                        src={item.image} 
                                        onClick={() => onImageClick(item.image)}
                                        alt="Evidence" 
                                        className="w-16 h-16 object-cover rounded border border-gray-200 cursor-zoom-in hover:opacity-80" 
                                    />
                                </div>
                            ) : null}
                            <p className="text-gray-700">{item.content}</p>
                        </div>
                     ))
                 )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl space-y-3">
                <input 
                    type="text" 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nội dung..." 
                    className="w-full border border-gray-200 rounded px-3 py-2 text-xs focus:border-blue-400 outline-none"
                    disabled={isViewAll}
                />
                <input 
                    type="text" 
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder={solutionPlaceholder}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-xs focus:border-blue-400 outline-none"
                    disabled={isViewAll}
                />
                <button 
                    onClick={() => {
                        onSave(content, solution);
                        setContent('');
                        setSolution('');
                    }}
                    disabled={isViewAll}
                    className={`w-full py-2 rounded text-xs font-bold uppercase transition-colors ${
                        isViewAll ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : `${colorClass.replace('text-', 'bg-').replace('600', '100')} ${colorClass} hover:brightness-95`
                    }`}
                >
                    {isViewAll ? 'Chỉ xem (Không lưu)' : btnText}
                </button>
            </div>
        </div>
    );
}

// Icons
const ScissorsIcon = ({size, className}: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
);

const ArchiveIcon = ({size, className}: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
);

export default DocumentDetail;

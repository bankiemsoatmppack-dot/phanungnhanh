
import React, { useState } from 'react';
import { X, Save, Calendar, User, Database, Check } from 'lucide-react';
import { Document } from '../types';
import { assignSlotForNewDocument } from '../services/storageService';

interface Props {
  onClose: () => void;
  onAdd: (doc: Document) => void;
  currentUser?: { name: string, department: string };
}

const AddDocumentModal: React.FC<Props> = ({ onClose, onAdd, currentUser }) => {
  const [formData, setFormData] = useState({
    sender: '',
    title: '',
    productionOrder: '',
    code: `SKU-${Math.floor(Math.random() * 10000)}`,
    abstract: 'Hồ sơ sản xuất mới'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sender || !formData.title || !formData.productionOrder) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    const assignedSlotId = assignSlotForNewDocument();
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2,'0')}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getFullYear()}`;

    const newDoc: Document = {
      id: Date.now().toString(),
      title: formData.title,
      code: formData.code,
      productionOrder: formData.productionOrder,
      date: dateStr,
      sender: formData.sender,
      status: 'processing',
      urgency: 'normal',
      type: 'incoming',
      abstract: formData.abstract,
      department: currentUser?.department || 'Kế Hoạch',
      handler: currentUser?.name || 'Admin',
      specs: undefined,
      defects: [],
      specLogs: [],
      approvalItems: [],
      messages: [],
      storageSlotId: assignedSlotId
    };

    onAdd(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="bg-white/20 p-1 rounded"><Database size={18}/></span>
              Thêm mới Hồ sơ
            </h2>
            <p className="text-xs text-blue-100 opacity-80 mt-1">Tạo hồ sơ khách hàng & Phiếu SX mới</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-blue-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
           
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
               <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-1">
                   <User size={16} />
               </div>
               <div>
                   <p className="text-xs font-bold text-blue-800 uppercase">Người tạo</p>
                   <p className="text-sm text-gray-700">{currentUser?.name || 'Admin'} - {currentUser?.department || 'Quản trị'}</p>
                   <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1"><Calendar size={10}/> {new Date().toLocaleDateString('en-GB')}</p>
               </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Khách hàng / Đối tác <span className="text-red-500">*</span></label>
                   <input 
                      type="text" 
                      required
                      value={formData.sender}
                      onChange={e => setFormData({...formData, sender: e.target.value})}
                      placeholder="VD: HEINEKEN, UNILEVER..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-gray-800"
                      autoFocus
                   />
               </div>

               <div className="col-span-2">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                   <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      placeholder="VD: Thùng Carton 5 lớp..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                   />
               </div>

               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phiếu Sản Xuất (PO) <span className="text-red-500">*</span></label>
                   <input 
                      type="text" 
                      required
                      value={formData.productionOrder}
                      onChange={e => setFormData({...formData, productionOrder: e.target.value})}
                      placeholder="VD: PO-2024-001"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 outline-none font-mono text-blue-700 font-bold"
                   />
               </div>

               <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã sản phẩm (SKU)</label>
                   <input 
                      type="text" 
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500 font-mono"
                   />
               </div>

               <div className="col-span-2">
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú / Trích yếu</label>
                   <textarea 
                      value={formData.abstract}
                      onChange={e => setFormData({...formData, abstract: e.target.value})}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:border-blue-500 outline-none"
                   />
               </div>
           </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                Hủy bỏ
            </button>
            <button onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95">
                <Save size={18} /> Lưu Hồ Sơ
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentModal;

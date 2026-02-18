
import React, { useState } from 'react';
import { Document } from '../types';
import { Search, Filter, Plus, Folder, ChevronDown, ChevronRight, Layers, FileBox, Edit2, Trash2, X, Check } from 'lucide-react';

interface Props {
  documents: Document[];
  selectedProductKey?: string; // Identifier for Sender+Title
  onSelectProduct: (sender: string, title: string) => void;
  onOpenAddModal: () => void;
  onDeleteGroup?: (sender: string, title: string) => void;
  onEditGroup?: (oldSender: string, oldTitle: string, newSender: string, newTitle: string) => void;
}

const DocumentList: React.FC<Props> = ({ documents, selectedProductKey, onSelectProduct, onOpenAddModal, onDeleteGroup, onEditGroup }) => {
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  
  // Edit State
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ sender: '', title: '' });

  const toggleCustomer = (customer: string) => {
    setExpandedCustomers(prev => ({ ...prev, [customer]: !prev[customer] }));
  };

  // Grouping Logic: Customer -> Product Name (No POs here)
  const groupedProducts = documents.reduce((acc, doc) => {
    const customer = doc.sender;
    const product = doc.title;
    
    if (!acc[customer]) {
      acc[customer] = new Set<string>();
    }
    acc[customer].add(product);
    return acc;
  }, {} as Record<string, Set<string>>);

  // Helper to calculate pending items for a product (across all its POs)
  const getPendingCountForProduct = (customer: string, product: string) => {
      const productDocs = documents.filter(d => d.sender === customer && d.title === product);
      return productDocs.reduce((total, doc) => {
          const pendingInDoc = (doc.approvalItems || []).filter(item => item.status === 'pending').length;
          return total + pendingInDoc;
      }, 0);
  };

  const handleStartEdit = (e: React.MouseEvent, sender: string, title: string) => {
      e.stopPropagation();
      setEditingKey(`${sender}|${title}`);
      setEditForm({ sender, title });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingKey(null);
  };

  const handleSaveEdit = (e: React.MouseEvent, oldSender: string, oldTitle: string) => {
      e.stopPropagation();
      if (onEditGroup) {
          onEditGroup(oldSender, oldTitle, editForm.sender, editForm.title);
      }
      setEditingKey(null);
  };

  const handleDelete = (e: React.MouseEvent, sender: string, title: string) => {
      e.stopPropagation();
      if (window.confirm(`⚠️ CẢNH BÁO XÓA DỮ LIỆU\n\nBạn có chắc chắn muốn xóa hồ sơ sản phẩm:\n"${title}" - Khách hàng: ${sender}?\n\nHành động này sẽ xóa vĩnh viễn tất cả các Phiếu SX liên quan khỏi Kho Dữ Liệu.`)) {
          if (onDeleteGroup) onDeleteGroup(sender, title);
      }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full">
      {/* Header Search & Tools */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
            Danh sách Hồ sơ <span className="text-gray-400 font-normal text-sm"></span>
        </h2>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm khách hàng/sản phẩm..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded bg-gray-50 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button 
            onClick={onOpenAddModal}
            className="p-1.5 border border-blue-500 bg-blue-500 rounded text-white hover:bg-blue-600 transition-colors"
            title="Thêm hồ sơ mới"
          >
             <Plus size={16} />
          </button>
        </div>
        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cột 2: Sản Phẩm (Sửa/Xóa tại đây)</div>
      </div>

      {/* Nested List */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(groupedProducts).map(([customer, productsSet]) => {
            const isCustomerOpen = expandedCustomers[customer] ?? true; // Default open
            const products = Array.from(productsSet as Set<string>);

            return (
                <div key={customer} className="mb-2">
                    {/* Level 1: Customer */}
                    <div 
                        onClick={() => toggleCustomer(customer)}
                        className="px-2 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-2 uppercase cursor-pointer hover:bg-gray-200 select-none border border-gray-200 group"
                    >
                        {isCustomerOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        <Folder size={14} className="text-blue-500"/>
                        <span className="flex-1 truncate">{customer}</span>
                        <span className="text-[9px] bg-gray-200 px-1.5 rounded text-gray-500 font-normal">{products.length} SP</span>
                    </div>

                    {isCustomerOpen && (
                        <div className="ml-2 pl-2 border-l-2 border-gray-200 mt-1 space-y-1">
                            {products.map((productName) => {
                                const currentKey = `${customer}|${productName}`;
                                const isSelected = selectedProductKey === currentKey;
                                const pendingCount = getPendingCountForProduct(customer, productName);
                                const isEditing = editingKey === currentKey;

                                return (
                                    <div 
                                        key={productName}
                                        onClick={() => !isEditing && onSelectProduct(customer, productName)}
                                        className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors text-sm border group relative ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium' : 'hover:bg-gray-50 border-transparent text-gray-600'}`}
                                    >
                                        <FileBox size={14} className={`mt-0.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                        
                                        <div className="flex-1 min-w-0">
                                            {isEditing ? (
                                                <div className="flex flex-col gap-2 p-1 bg-white border border-blue-300 rounded shadow-sm z-10">
                                                    <input 
                                                        value={editForm.sender} 
                                                        onChange={e => setEditForm({...editForm, sender: e.target.value})}
                                                        className="text-xs border rounded px-1 py-0.5 outline-none focus:border-blue-500"
                                                        placeholder="Tên Khách Hàng"
                                                    />
                                                    <input 
                                                        value={editForm.title} 
                                                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                                                        className="text-xs border rounded px-1 py-0.5 outline-none focus:border-blue-500 font-bold"
                                                        placeholder="Tên Sản Phẩm"
                                                    />
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={handleCancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={12}/></button>
                                                        <button onClick={(e) => handleSaveEdit(e, customer, productName)} className="p-1 text-green-500 hover:bg-green-50 rounded"><Check size={12}/></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="leading-tight text-xs break-words">{productName}</span>
                                                    
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {pendingCount > 0 && (
                                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                                                                {pendingCount}
                                                            </span>
                                                        )}
                                                        {/* Action Buttons (Hover Only) */}
                                                        <div className="hidden group-hover:flex bg-white/80 rounded backdrop-blur-sm shadow-sm border border-gray-100">
                                                            <button 
                                                                onClick={(e) => handleStartEdit(e, customer, productName)}
                                                                className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors" 
                                                                title="Sửa tên SP/KH"
                                                            >
                                                                <Edit2 size={12}/>
                                                            </button>
                                                            <button 
                                                                onClick={(e) => handleDelete(e, customer, productName)}
                                                                className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors" 
                                                                title="Xóa hồ sơ này"
                                                            >
                                                                <Trash2 size={12}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default DocumentList;

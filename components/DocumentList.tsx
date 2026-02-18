import React, { useState } from 'react';
import { Document } from '../types';
import { Search, Filter, Plus, Folder, ChevronDown, ChevronRight, Layers, FileBox } from 'lucide-react';

interface Props {
  documents: Document[];
  selectedProductKey?: string; // Identifier for Sender+Title
  onSelectProduct: (sender: string, title: string) => void;
  onOpenAddModal: () => void;
}

const DocumentList: React.FC<Props> = ({ documents, selectedProductKey, onSelectProduct, onOpenAddModal }) => {
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});

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
        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Cột 2: Sản Phẩm</div>
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
                        className="px-2 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-2 uppercase cursor-pointer hover:bg-gray-200 select-none border border-gray-200"
                    >
                        {isCustomerOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        <Folder size={14} className="text-blue-500"/>
                        {customer}
                    </div>

                    {isCustomerOpen && (
                        <div className="ml-2 pl-2 border-l-2 border-gray-200 mt-1 space-y-1">
                            {products.map((productName) => {
                                const currentKey = `${customer}|${productName}`;
                                const isSelected = selectedProductKey === currentKey;
                                const pendingCount = getPendingCountForProduct(customer, productName);

                                return (
                                    <div 
                                        key={productName}
                                        onClick={() => onSelectProduct(customer, productName)}
                                        className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors text-sm border ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium' : 'hover:bg-gray-50 border-transparent text-gray-600'}`}
                                    >
                                        <FileBox size={14} className={`mt-0.5 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                        <div className="flex-1 leading-tight text-xs flex justify-between items-center gap-2">
                                            <span>{productName}</span>
                                            {pendingCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                                                    {pendingCount}
                                                </span>
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
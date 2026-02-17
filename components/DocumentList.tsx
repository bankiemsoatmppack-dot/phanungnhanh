
import React, { useState } from 'react';
import { Document } from '../types';
import { Search, Filter, Plus, Folder, ChevronDown, ChevronRight, FileText, Layers } from 'lucide-react';

interface Props {
  documents: Document[];
  selectedId?: string;
  onSelect: (doc: Document) => void;
  onOpenAddModal: () => void;
}

const DocumentList: React.FC<Props> = ({ documents, selectedId, onSelect, onOpenAddModal }) => {
  // State for expanded groups
  const [expandedCustomers, setExpandedCustomers] = useState<Record<string, boolean>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  const toggleCustomer = (customer: string) => {
    setExpandedCustomers(prev => ({ ...prev, [customer]: !prev[customer] }));
  };

  const toggleProduct = (productKey: string) => {
    setExpandedProducts(prev => ({ ...prev, [productKey]: !prev[productKey] }));
  };

  // Grouping Logic: Customer -> Product Name -> List of POs
  const groupedDocs = documents.reduce((acc, doc) => {
    const customer = doc.sender;
    const product = doc.title;
    
    if (!acc[customer]) {
      acc[customer] = {};
    }
    if (!acc[customer][product]) {
      acc[customer][product] = [];
    }
    acc[customer][product].push(doc);
    return acc;
  }, {} as Record<string, Record<string, Document[]>>);

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-full">
      {/* Header Search & Tools */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
            Hồ sơ khách hàng <span className="text-gray-400 font-normal text-sm">({documents.length})</span>
        </h2>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm hồ sơ..."
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
          <button className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50">
             <Filter size={16} className="text-gray-500" />
          </button>
        </div>
        
        {/* Quick Filters */}
        <div className="flex gap-4 text-xs font-semibold text-gray-500 border-b border-gray-100 pb-2">
            <button className="text-blue-600 border-b-2 border-blue-600 pb-2 -mb-2.5">Đang sản xuất</button>
            <button className="hover:text-gray-800 pb-2">Lưu kho (Full 10 Kho)</button>
        </div>
      </div>

      {/* Nested List */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(groupedDocs).map(([customer, products]) => {
            const isCustomerOpen = expandedCustomers[customer] ?? true; // Default open
            
            return (
                <div key={customer} className="mb-2">
                    {/* Level 1: Customer */}
                    <div 
                        onClick={() => toggleCustomer(customer)}
                        className="px-2 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-2 uppercase cursor-pointer hover:bg-gray-200 select-none"
                    >
                        {isCustomerOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        <Folder size={14} className="text-blue-500"/>
                        {customer}
                    </div>

                    {isCustomerOpen && (
                        <div className="ml-2 pl-2 border-l border-gray-200 mt-1 space-y-1">
                            {Object.entries(products).map(([productName, docs]) => {
                                const productKey = `${customer}-${productName}`;
                                const isProductOpen = expandedProducts[productKey] ?? false;
                                
                                // Sort docs by date descending (newest PO first)
                                const sortedDocs = [...docs].sort((a, b) => {
                                     // Mock sort, assuming date string format DD/MM/YYYY
                                     const dateA = a.date.split('/').reverse().join('');
                                     const dateB = b.date.split('/').reverse().join('');
                                     return dateB.localeCompare(dateA);
                                });

                                // Check if any doc in this product is selected
                                const isAnySelected = sortedDocs.some(d => d.id === selectedId);

                                return (
                                    <div key={productKey}>
                                        {/* Level 2: Product Name */}
                                        <div 
                                            onClick={() => {
                                                toggleProduct(productKey);
                                                // Auto-select the latest PO if opening the product and nothing selected
                                                if (!isProductOpen && !isAnySelected) {
                                                    onSelect(sortedDocs[0]);
                                                }
                                            }}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm ${isAnySelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="text-gray-400">
                                                 {isProductOpen ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                                            </div>
                                            <div className="flex-1 font-medium text-gray-700 truncate" title={productName}>
                                                {productName}
                                            </div>
                                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 rounded-full">{docs.length}</span>
                                        </div>

                                        {/* Level 3: PO List (Versions) */}
                                        {isProductOpen && (
                                            <div className="ml-6 space-y-1 mt-1 mb-2">
                                                {sortedDocs.map((doc) => (
                                                    <div
                                                        key={doc.id}
                                                        onClick={() => onSelect(doc)}
                                                        className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border border-transparent ${
                                                            selectedId === doc.id 
                                                            ? 'bg-blue-100 border-blue-200 text-blue-800' 
                                                            : 'bg-white hover:bg-gray-50 border-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Layers size={12} className={selectedId === doc.id ? 'text-blue-500' : 'text-gray-400'}/>
                                                            <span className="font-mono font-bold">{doc.productionOrder || doc.code}</span>
                                                        </div>
                                                        <span className="text-gray-400 text-[10px]">{doc.date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
      
      {/* Floating Action Button for Mobile/Tablet */}
      <button 
        onClick={onOpenAddModal}
        className="absolute bottom-6 right-6 md:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg z-20"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default DocumentList;

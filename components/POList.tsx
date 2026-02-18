
import React from 'react';
import { Document } from '../types';
import { Layers, Database, Calendar, AlertCircle } from 'lucide-react';

interface Props {
  productName: string;
  documents: Document[]; // Should be filtered by selected product already
  selectedDocId?: string;
  onSelectPO: (docId: string) => void;
}

const POList: React.FC<Props> = ({ productName, documents, selectedDocId, onSelectPO }) => {
  
  // Sort documents by date descending
  const sortedDocs = [...documents].sort((a, b) => {
      // Assuming date format DD/MM/YYYY
      const dateA = a.date.split('/').reverse().join('');
      const dateB = b.date.split('/').reverse().join('');
      return dateB.localeCompare(dateA);
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200 w-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <Layers size={18} className="text-orange-500"/>
                <span className="font-bold text-gray-700 text-sm">Danh sách Phiếu SX</span>
            </div>
            <p className="text-xs text-gray-500 truncate font-medium" title={productName}>
                SP: {productName || 'Chưa chọn sản phẩm'}
            </p>
             <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-2">Cột 3: Các phiên bản (PO)</div>
        </div>

        {/* PO List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                    <AlertCircle size={24} className="mx-auto mb-2 opacity-50"/>
                    Chưa có hồ sơ nào
                </div>
            ) : (
                sortedDocs.map((doc) => {
                    const isSelected = doc.id === selectedDocId;
                    return (
                        <div
                            key={doc.id}
                            onClick={() => onSelectPO(doc.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                                isSelected 
                                ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-200' 
                                : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold font-mono text-sm ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                    {doc.productionOrder || doc.code}
                                </span>
                                {doc.storageSlotId && (
                                    <span className="flex items-center gap-0.5 text-[9px] bg-green-50 text-green-700 border border-green-200 px-1 rounded font-bold">
                                        <Database size={8} /> K{doc.storageSlotId}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar size={12}/> {doc.date}
                            </div>
                            
                            {/* Status Indicator */}
                            <div className="flex justify-between items-center mt-2">
                                <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    doc.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                    doc.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {doc.status === 'approved' ? 'Đã duyệt' : 'Đang xử lý'}
                                </div>
                                {doc.approvalItems && doc.approvalItems.some(i => i.status === 'pending') && (
                                     <div className="w-2 h-2 rounded-full bg-red-500" title="Có chờ duyệt"></div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};

export default POList;

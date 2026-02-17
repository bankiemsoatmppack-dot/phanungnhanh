import React from 'react';
import { Document } from '../types';
import { Bell, ArrowRight, CheckCircle, Clock } from 'lucide-react';

interface Props {
  documents: Document[];
  onSelectDocument: (doc: Document) => void;
}

const Notifications: React.FC<Props> = ({ documents, onSelectDocument }) => {
  // Aggregate all pending approval items
  const allPendingItems = documents.flatMap(doc => 
    (doc.approvalItems || [])
      .filter(item => item.status === 'pending')
      .map(item => ({ ...item, documentTitle: doc.title, documentId: doc.id, doc: doc }))
  );

  return (
    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-500 p-3 rounded-lg text-white shadow-lg shadow-red-500/30">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Thông báo chờ duyệt</h2>
            <p className="text-gray-500 text-sm">Danh sách các lỗi và nội dung cần Admin xem xét</p>
          </div>
        </div>

        {allPendingItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
             </div>
             <h3 className="text-lg font-bold text-gray-700">Không có thông báo mới</h3>
             <p className="text-gray-500">Tất cả các hạng mục đã được xử lý.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allPendingItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex gap-4">
                {/* Image / Icon */}
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {item.image ? (
                        <img src={item.image} alt="Issue" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Clock size={24} />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                {item.category} • {item.doc.code}
                            </div>
                            <span className="text-xs text-gray-400">{item.timestamp}</span>
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">{item.documentTitle}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 italic">"{item.content}"</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                        {item.solution && (
                             <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                                <strong>Khắc phục:</strong> {item.solution}
                             </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center border-l border-gray-100 pl-4 ml-2">
                   <button 
                     onClick={() => onSelectDocument(item.doc)}
                     className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                   >
                      Xem chi tiết <ArrowRight size={16} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

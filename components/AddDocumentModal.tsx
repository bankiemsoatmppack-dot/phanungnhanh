
import React from 'react';
import { X, Upload, Scan, Plus, UserPlus } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const AddDocumentModal: React.FC<Props> = ({ onClose }) => {
  // In a real implementation, this would handle form submission 
  // and call assignSlotForNewDocument() similar to MobileUserView
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">P</span>
              Thêm mới hồ sơ (Admin)
            </h2>
            <p className="text-xs text-gray-500 ml-8">Hồ sơ sẽ được tự động phân vào Kho dữ liệu còn trống</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           <div className="bg-blue-50 p-4 text-center rounded border border-blue-100 text-blue-700">
               Tính năng này đang được cập nhật đồng bộ với quy trình Mobile. <br/>
               Vui lòng sử dụng giao diện Mobile để tạo hồ sơ mới trong phiên bản Demo này.
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 sticky bottom-0">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 text-gray-600">Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentModal;

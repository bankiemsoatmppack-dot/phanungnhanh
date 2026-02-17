import React from 'react';
import { X, Upload, Scan, Plus, UserPlus } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const AddDocumentModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">P</span>
              Thêm mới công văn đến
            </h2>
            <p className="text-xs text-gray-500 ml-8">Tạo & upload file văn bản</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Upload Section */}
          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
             <div className="flex items-center gap-2 text-sm text-gray-700">
                <img src="https://cdn-icons-png.flaticon.com/512/732/732220.png" alt="xlsx" className="w-8 h-8" />
                <span className="font-medium">HN2525_ve_viec_mo_chien_dich_markring .xlsx (12MB)</span>
             </div>
             <div className="flex gap-2">
                <button className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-blue-700">
                   <Upload size={14} /> Chọn file
                </button>
                <button className="bg-orange-400 text-white px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-orange-500">
                   <Scan size={14} /> Scan
                </button>
             </div>
          </div>

          <h3 className="text-blue-600 text-sm font-bold uppercase border-b pb-1">Thông tin văn bản</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Row 1 */}
             <div className="md:col-span-2 flex items-end gap-2">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Đơn vị | <span className="text-blue-500">Phòng ban</span></label>
                    <div className="relative">
                        <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                            <option>Sở Giao dịch chứng khoán Việt Nam</option>
                        </select>
                    </div>
                </div>
                <button className="bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600">Add</button>
             </div>

             {/* Row 2 */}
             <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phân loại</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                    <option>Công văn</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nguồn văn bản</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                    <option>Cơ quan nhà nước</option>
                </select>
             </div>

             {/* Row 3 - Multiple small inputs */}
             <div className="md:col-span-2 grid grid-cols-4 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Số văn bản</label>
                    <input type="text" defaultValue="CV22001/SGDCK" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
                 <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày văn bản</label>
                    <input type="date" defaultValue="2021-11-17" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
                 <div className="col-span-0.5">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Số bản</label>
                    <input type="number" defaultValue="3" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
                 <div className="col-span-0.5">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Số trang</label>
                    <input type="number" defaultValue="10" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
             </div>

             {/* Row 4 - Textarea */}
             <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Trích yếu</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none" defaultValue="CV: Sửa đổi, bổ sung một số điều của Nghị định số 37/2015/NĐ-CP ngày 22 tháng 4 năm 2015 ..."></textarea>
             </div>

             {/* Row 5 */}
             <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mức độ khẩn</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                    <option>Bình thường</option>
                    <option>Khẩn</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cấp bảo mật</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                    <option>Cao</option>
                    <option>Thường</option>
                </select>
             </div>

             {/* Row 6 */}
             <div className="md:col-span-2">
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Nơi nhận</label>
                 <div className="flex">
                    <input type="text" defaultValue="Công ty Cổ phần tin học Lạc Việt" className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-sm" />
                    <button className="border border-l-0 border-gray-300 px-3 bg-gray-50 rounded-r text-gray-500"><UserPlus size={16}/></button>
                 </div>
             </div>

             {/* Row 7 */}
             <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Hình thức nhận</label>
                <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white">
                    <option>Fax</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày nhận</label>
                <input type="date" defaultValue="2021-11-17" className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
             </div>
             
             {/* Row 8 */}
             <div className="md:col-span-2">
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Người chịu trách nhiệm</label>
                 <div className="flex">
                    <input type="text" defaultValue="Tổng giám đốc" className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-sm" />
                    <button className="border border-l-0 border-gray-300 px-3 bg-gray-50 rounded-r text-gray-500 text-blue-500"><UserPlus size={16}/></button>
                 </div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 sticky bottom-0">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-100 text-gray-600">Đóng</button>
            <button className="px-6 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 shadow-lg shadow-blue-500/30">Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentModal;


import React, { useEffect, useState } from 'react';
import { X, MessageSquare, Image as ImageIcon, AlertCircle, ArrowRight } from 'lucide-react';

export interface ToastMessage {
  id: string;
  docId: string;
  docTitle: string;
  sender: string;
  type: 'TEXT' | 'IMAGE' | 'APPROVAL';
  content: string;
}

interface Props {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
  onClick: (docId: string) => void;
}

const GlobalToast: React.FC<Props> = ({ toasts, onRemove, onClick }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} onClick={onClick} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void; onClick: (id: string) => void }> = ({ toast, onRemove, onClick }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300); // Wait for animation
    }, 3000); // 3 Seconds display time

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const getStyle = () => {
    switch (toast.type) {
      case 'APPROVAL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-500',
          text: 'text-red-800',
          icon: <AlertCircle size={20} className="text-red-600 animate-pulse" />,
          label: 'YÊU CẦU DUYỆT / LỖI'
        };
      case 'IMAGE':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          text: 'text-orange-800',
          icon: <ImageIcon size={20} className="text-orange-600" />,
          label: 'HÌNH ẢNH MỚI'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-blue-500',
          text: 'text-gray-800',
          icon: <MessageSquare size={20} className="text-blue-600" />,
          label: 'TIN NHẮN MỚI'
        };
    }
  };

  const style = getStyle();

  return (
    <div 
        className={`pointer-events-auto shadow-xl rounded-lg border-l-4 p-3 flex items-start gap-3 transition-all duration-300 transform cursor-pointer hover:opacity-90 ${style.bg} ${style.border} ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
        onClick={() => onClick(toast.docId)}
    >
      <div className="mt-1 shrink-0">
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
            <span className={`text-[10px] font-bold px-1 rounded uppercase tracking-wider mb-0.5 ${style.text} bg-white/50 border border-current`}>
                {style.label}
            </span>
            <button onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
            </button>
        </div>
        <h4 className="font-bold text-xs truncate text-gray-900">{toast.docTitle}</h4>
        <div className="text-xs font-semibold text-gray-600 mt-0.5">{toast.sender}:</div>
        <p className="text-xs text-gray-500 truncate">{toast.content}</p>
      </div>
    </div>
  );
};

export default GlobalToast;


import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Minus } from 'lucide-react';
import { User as AppUser } from '../types';

interface Message {
    id: string;
    text: string;
    sender: string;
    isMe: boolean;
    timestamp: string;
}

interface Props {
    user: AppUser;
}

const FloatingChat: React.FC<Props> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const newMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: user.name,
            isMe: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, newMsg]);
        setInput('');

        // Simulate reply
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: "Chào bạn, đây là tin nhắn tự động từ hệ thống chat nội bộ (Không lưu).",
                sender: "Bot Hệ Thống",
                isMe: false,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        }, 1000);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                // Changed from bottom-6 to bottom-28 to avoid overlapping with the Add Document FAB (which is at bottom-10)
                className="fixed bottom-28 right-6 w-14 h-14 bg-blue-600 rounded-full text-white shadow-xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all z-50 animate-bounce"
                title="Chat nội bộ"
            >
                <MessageCircle size={28} />
            </button>
        );
    }

    if (isMinimized) {
         return (
            <div 
                // Moved up to match the bubble position
                className="fixed bottom-28 right-6 w-64 bg-white rounded-t-lg shadow-xl border border-blue-200 z-50 flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setIsMinimized(false)}
            >
                <div className="flex items-center gap-2 font-bold text-blue-700 text-sm">
                    <MessageCircle size={16} /> Chat Nội Bộ
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    className="text-gray-400 hover:text-red-500"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        // Moved up to match
        <div className="fixed bottom-28 right-6 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300" style={{ height: '500px' }}>
            {/* Header */}
            <div className="bg-blue-600 p-3 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-2 font-bold text-sm">
                    <MessageCircle size={18} /> Chat Nội Bộ (Không lưu)
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsMinimized(true)} className="hover:bg-blue-700 p-1 rounded"><Minus size={16}/></button>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-red-500 p-1 rounded"><X size={16}/></button>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 p-2 text-[10px] text-yellow-800 text-center border-b border-yellow-100">
                Tin nhắn sẽ mất khi tải lại trang
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-xs mt-10">
                        Bắt đầu cuộc trò chuyện mới...
                    </div>
                )}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-500 mb-0.5 px-1">{msg.sender}</span>
                        <div className={`px-3 py-2 rounded-lg max-w-[80%] text-sm break-words ${msg.isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                        <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.timestamp}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Nhập tin nhắn..." 
                    className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                />
                <button 
                    onClick={handleSend}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

export default FloatingChat;

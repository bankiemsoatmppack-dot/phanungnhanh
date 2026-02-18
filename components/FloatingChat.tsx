
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Minus, Users, Circle, MoreVertical, Wifi, WifiOff } from 'lucide-react';
import { User as AppUser } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { getOnlineUserIds, getInternalGroupMessages, sendInternalGroupMessage } from '../services/storageService';

interface Message {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    isMe: boolean;
    timestamp: string;
    avatarColor?: string;
}

interface ChatMember {
    id: string;
    name: string;
    isOnline: boolean;
    avatarColor: string;
    department: string;
}

interface Props {
    user: AppUser;
}

// Colors for avatars
const AVATAR_COLORS = ['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];

const FloatingChat: React.FC<Props> = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showMembers, setShowMembers] = useState(false); // Toggle Member List
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [members, setMembers] = useState<ChatMember[]>([]);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. POLLING for ONLINE MEMBERS and CHAT HISTORY
    useEffect(() => {
        // Function to refresh data
        const refreshData = () => {
            // A. Get Online IDs from Storage (Real-time Simulation)
            const onlineIds = getOnlineUserIds();
            
            // B. Map Mock Employees to Online Status
            const updatedMembers = MOCK_EMPLOYEES.map((emp, index) => ({
                id: emp.id,
                name: emp.name,
                isOnline: onlineIds.includes(emp.id) || emp.id === user.id, // Current user always online
                avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
                department: emp.department
            }));

            // Ensure current user (if admin not in mock) is added
            if (!updatedMembers.find(m => m.id === user.id)) {
                 updatedMembers.push({
                    id: user.id,
                    name: user.name,
                    isOnline: true,
                    avatarColor: 'bg-blue-600',
                    department: user.department || 'AD'
                 });
            }
            setMembers(updatedMembers);

            // C. Sync Chat History
            const storedMsgs = getInternalGroupMessages();
            const formattedMsgs = storedMsgs.map((m: any) => ({
                ...m,
                isMe: m.senderId === user.id
            }));
            
            // Only update if length changed to avoid jitter, or deep check
            setMessages(prev => {
                if (prev.length !== formattedMsgs.length) return formattedMsgs;
                return prev;
            });
        };

        refreshData(); // Initial load
        const interval = setInterval(refreshData, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [user.id]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const newMsg = {
            id: Date.now().toString(),
            text: input,
            senderId: user.id,
            senderName: user.name,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatarColor: members.find(m => m.id === user.id)?.avatarColor || 'bg-blue-600'
        };
        
        // Save to Local Storage (Shared across tabs)
        sendInternalGroupMessage(newMsg);
        setInput('');
    };

    const onlineCount = members.filter(m => m.isOnline).length;

    if (!isOpen) {
        return (
            <div className="fixed bottom-28 right-6 z-50 flex flex-col items-end gap-2">
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-blue-600 rounded-full text-white shadow-xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all animate-bounce relative"
                    title="Chat nhóm nội bộ"
                >
                    <MessageCircle size={28} />
                    {/* Online Indicator Badge */}
                    <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold">
                        {onlineCount}
                    </span>
                </button>
            </div>
        );
    }

    if (isMinimized) {
         return (
            <div 
                className="fixed bottom-28 right-6 w-72 bg-white rounded-t-lg shadow-xl border border-blue-200 z-50 flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setIsMinimized(false)}
            >
                <div className="flex items-center gap-2 font-bold text-blue-700 text-sm">
                    <Users size={16} /> 
                    <span>Nhóm Nội Bộ ({onlineCount} Online)</span>
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="text-gray-400 hover:text-red-500 p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            className={`fixed bottom-28 right-6 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300 transition-all`}
            style={{ height: '500px', width: showMembers ? '600px' : '380px' }} // Expand width when members shown
        >
            {/* Header */}
            <div className="bg-blue-600 p-3 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Users size={20} />
                        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-400 border border-blue-600 rounded-full"></span>
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-sm">Nhóm Phản Ứng Nhanh</span>
                        <span className="text-[10px] opacity-80 cursor-pointer hover:underline" onClick={() => setShowMembers(!showMembers)}>
                            {onlineCount} người đang online
                        </span>
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    <button 
                        onClick={() => setShowMembers(!showMembers)} 
                        className={`p-1.5 rounded hover:bg-blue-700 transition-colors ${showMembers ? 'bg-blue-800' : ''}`}
                        title="Danh sách thành viên"
                    >
                        <MoreVertical size={16} />
                    </button>
                    <button onClick={() => setIsMinimized(true)} className="hover:bg-blue-700 p-1.5 rounded"><Minus size={16}/></button>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-red-500 p-1.5 rounded"><X size={16}/></button>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-blue-50 p-1.5 text-[10px] text-blue-800 text-center border-b border-blue-100 flex justify-center items-center gap-1 font-medium">
                <Wifi size={10} className="text-green-600"/> <span>Chat Nhóm Nội Bộ (Online Real-time)</span>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50 relative">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                             <div className="text-center text-gray-400 text-xs py-10 italic">
                                 Đây là kênh chat riêng nội bộ. <br/>
                                 Chưa có tin nhắn nào.
                             </div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!msg.isMe && (
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${msg.avatarColor || 'bg-gray-400'}`}>
                                            {msg.senderName.charAt(0)}
                                        </div>
                                    )}
                                    <div className={`flex flex-col max-w-[75%] ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                        {!msg.isMe && <span className="text-[10px] text-gray-500 ml-1 mb-0.5">{msg.senderName}</span>}
                                        <div className={`px-3 py-2 rounded-xl text-sm break-words shadow-sm ${
                                            msg.isMe 
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                        }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.timestamp}</span>
                                    </div>
                                </div>
                            ))
                        )}
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
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

                {/* Member List Sidebar (Collapsible) */}
                {showMembers && (
                    <div className="w-56 bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-3 border-b border-gray-100 font-bold text-gray-700 text-xs uppercase bg-gray-50">
                            Thành viên ({members.length})
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {/* Sort: Online first, then by name */}
                            {[...members].sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1)).map(member => (
                                <div key={member.id} className={`flex items-center gap-2 p-2 rounded transition-colors cursor-default ${member.isOnline ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                    <div className="relative">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${member.avatarColor}`}>
                                            {member.name.charAt(0)}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                                            member.isOnline ? 'bg-green-500' : 'bg-gray-300'
                                        }`} title={member.isOnline ? 'Online' : 'Offline'}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-gray-800 truncate">{member.name}</div>
                                        <div className="text-[10px] text-gray-500 flex justify-between">
                                            <span>{member.department}</span>
                                            {member.isOnline ? (
                                                <span className="text-green-600 font-bold flex items-center gap-0.5"><Wifi size={8}/> On</span>
                                            ) : (
                                                <span className="text-gray-400">Off</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FloatingChat;

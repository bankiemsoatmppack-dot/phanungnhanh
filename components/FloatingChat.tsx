
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Minus, Users, Circle, MoreVertical } from 'lucide-react';
import { User as AppUser } from '../types';
import { MOCK_EMPLOYEES } from '../constants';

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
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Initialize Members and Status
    useEffect(() => {
        const initMembers = MOCK_EMPLOYEES.map((emp, index) => ({
            id: emp.id,
            name: emp.name,
            // Randomly assign online status (except current user is always online logic handled later)
            isOnline: Math.random() > 0.3, 
            avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
            department: emp.department
        }));

        // Ensure current user is in the list and Online
        const currentUserIndex = initMembers.findIndex(m => m.id === user.id);
        if (currentUserIndex >= 0) {
            initMembers[currentUserIndex].isOnline = true;
        } else {
            // Add current user if not in mock list (e.g. Admin)
            initMembers.push({
                id: user.id,
                name: user.name,
                isOnline: true,
                avatarColor: 'bg-blue-600',
                department: user.department || 'AD'
            });
        }

        setMembers(initMembers);

        // Initial Dummy Messages
        setMessages([
            {
                id: '1',
                text: 'Chào mọi người, hôm nay có lịch kiểm tra máy in lúc 10h nhé.',
                senderId: '2',
                senderName: 'Trần Thị B',
                isMe: false,
                timestamp: '08:30 AM',
                avatarColor: AVATAR_COLORS[1]
            },
            {
                id: '2',
                text: 'Ok chị, em đã chuẩn bị hồ sơ xong rồi.',
                senderId: '4',
                senderName: 'Phạm Thị D',
                isMe: false,
                timestamp: '08:35 AM',
                avatarColor: AVATAR_COLORS[3]
            }
        ]);
    }, [user]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, showMembers]);

    // Simulate Incoming Messages from Online Colleagues
    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            // Only online users (excluding me) can send messages
            const onlineColleagues = members.filter(m => m.isOnline && m.id !== user.id);
            
            if (onlineColleagues.length > 0 && Math.random() > 0.7) { // 30% chance every 5s
                const randomSender = onlineColleagues[Math.floor(Math.random() * onlineColleagues.length)];
                const randomPhrases = [
                    "Đã nhận thông tin.",
                    "Hồ sơ này cần duyệt gấp nhé mọi người.",
                    "Ai đang trực ở kho kiểm tra giúp mình mã 005 với.",
                    "Ok.",
                    "Đang xử lý nhé.",
                    "Mọi người chú ý đơn hàng Heineken nhé."
                ];
                const text = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];

                const newMsg: Message = {
                    id: Date.now().toString(),
                    text: text,
                    senderId: randomSender.id,
                    senderName: randomSender.name,
                    isMe: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    avatarColor: randomSender.avatarColor
                };
                setMessages(prev => [...prev, newMsg]);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen, members, user.id]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const newMsg: Message = {
            id: Date.now().toString(),
            text: input,
            senderId: user.id,
            senderName: user.name,
            isMe: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatarColor: 'bg-blue-600'
        };
        
        setMessages(prev => [...prev, newMsg]);
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
            <div className="bg-yellow-50 p-1.5 text-[10px] text-yellow-800 text-center border-b border-yellow-100 flex justify-center items-center gap-1">
                <span>⚠️ Tin nhắn nhóm tự xóa khi đóng trình duyệt (Không lưu server)</span>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-gray-50 relative">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
                        {messages.map(msg => (
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
                                <div key={member.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 transition-colors cursor-default">
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
                                            <span className={member.isOnline ? 'text-green-600' : 'text-gray-400'}>
                                                {member.isOnline ? 'Online' : 'Offline'}
                                            </span>
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


import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DocumentList from './components/DocumentList';
import POList from './components/POList';
import DocumentDetail from './components/DocumentDetail';
import Dashboard from './components/Dashboard';
import AddDocumentModal from './components/AddDocumentModal';
import Login from './components/Login';
import MobileUserView from './components/MobileUserView';
import EmployeeManager from './components/EmployeeManager';
import Notifications from './components/Notifications';
import UrgentNotifications from './components/UrgentNotifications'; // NEW IMPORT
import Settings from './components/Settings';
import GlobalToast, { ToastMessage } from './components/GlobalToast'; 
import { MOCK_DOCUMENTS } from './constants';
import { Document, User, DefectEntry, Announcement, DocNotification } from './types';
import { Plus, AlertTriangle, Settings as SettingsIcon, ClipboardList, ArrowRight, Loader2, Database, BellRing } from 'lucide-react';
import { updatePresence, setOffline, fetchAnnouncementsFromSheet, saveAnnouncementToSheet, updateAnnouncementReadStatusInSheet, deleteAnnouncementFromSheet, fetchDocumentsFromSheet, saveDocumentToSheet, deleteDocumentFromSheet, logAction } from './services/storageService';
import { playNotificationSound } from './utils';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('DASHBOARD');
  const [documents, setDocuments] = useState<Document[]>([]);
  
  // Ref to store previous state for comparison logic
  const prevDocumentsRef = useRef<Document[]>([]);
  
  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  // Persistent Alert Button State (List of unread doc IDs)
  const [activeAlertDocs, setActiveAlertDocs] = useState<Set<string>>(new Set());

  // NEW: PERSISTENT URGENT NOTIFICATIONS (Yellow Bell / Tab)
  const [docNotifications, setDocNotifications] = useState<DocNotification[]>([]);

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementSource, setAnnouncementSource] = useState<{name: string, id: number} | null>(null);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  // Selection State
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedProductKey, setSelectedProductKey] = useState<string>('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigMissing, setIsConfigMissing] = useState(false);
  
  // State for missing solution notifications
  const [missingSolutions, setMissingSolutions] = useState<{docId: string, docTitle: string, defectId: string, defectContent: string}[]>([]);

  // --- NOTIFICATION LOGIC ---
  const handleNewNotification = (doc: Document, type: 'TEXT' | 'IMAGE' | 'APPROVAL', content: string, sender: string) => {
      // 0. Play Sound
      playNotificationSound();

      // 1. Add Toast (Ephemeral)
      const newToast: ToastMessage = {
          id: Date.now().toString() + Math.random(),
          docId: doc.id,
          docTitle: doc.title,
          sender: sender,
          type: type,
          content: content
      };
      setToasts(prev => [...prev, newToast]);

      // 2. Add to Urgent Notifications List (Persistent)
      // This populates the Yellow Bell (User) and Urgent Tab (Admin)
      const newUrgentNotif: DocNotification = {
          id: Date.now().toString() + Math.random(),
          docId: doc.id,
          docTitle: doc.title,
          poCode: doc.productionOrder || doc.code,
          sender: doc.sender,
          messageSender: sender,
          content: content,
          type: type === 'APPROVAL' ? 'DEFECT' : (type === 'IMAGE' ? 'IMAGE' : 'MSG'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false
      };
      setDocNotifications(prev => [newUrgentNotif, ...prev]);

      // 3. Add to Active Alert Button (Legacy visual aid)
      // Only add if we are NOT currently viewing this document
      if (selectedDocId !== doc.id || currentView !== 'DOCUMENTS') {
          setActiveAlertDocs(prev => new Set(prev).add(doc.id));
      }
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAlertClick = (docId: string) => {
      // Navigate to the doc
      const doc = documents.find(d => d.id === docId);
      if (doc) {
          setSelectedProductKey(`${doc.sender}|${doc.title}`);
          setSelectedDocId(doc.id);
          setCurrentView('DOCUMENTS');
          
          // Remove from alerts (legacy)
          setActiveAlertDocs(prev => {
              const next = new Set(prev);
              next.delete(docId);
              return next;
          });
      }
  };

  // NEW: Handle Urgent Notification Click (Admin Tab / Mobile Bell)
  const handleUrgentNotificationClick = (docId: string, notifId: string) => {
      // 1. Remove from list
      setDocNotifications(prev => prev.filter(n => n.id !== notifId));
      
      // 2. Navigate
      handleAlertClick(docId);
  };

  // --- LOAD DOCUMENTS FROM STORAGE (POLLING ENABLED) ---
  const loadDocuments = async (isInitialLoad = false) => {
      try {
          const fetchedDocs = await fetchDocumentsFromSheet();
          
          // --- REAL-TIME COMPARISON LOGIC ---
          // ENABLED FOR EVERYONE (Admin & User)
          if (!isInitialLoad && user) {
              fetchedDocs.forEach(newDoc => {
                  const oldDoc = prevDocumentsRef.current.find(d => d.id === newDoc.id);
                  
                  // 0. NEW DOCUMENT DETECTED
                  if (!oldDoc) {
                      // Skip notification if it was created by me just now
                      if (newDoc.handler !== user.name) {
                          handleNewNotification(newDoc, 'TEXT', 'Hồ sơ mới vừa được tạo', newDoc.sender);
                      }
                      return;
                  }

                  // 1. Check for New Messages
                  const newMsgCount = newDoc.messages?.length || 0;
                  const oldMsgCount = oldDoc.messages?.length || 0;

                  if (newMsgCount > oldMsgCount) {
                      // Get the new messages
                      const newMessages = newDoc.messages?.slice(oldMsgCount) || [];
                      newMessages.forEach(msg => {
                          if (!msg.isMe && msg.sender !== user.name) { // Only notify if NOT me
                              // Determine Type
                              let type: 'TEXT' | 'IMAGE' = 'TEXT';
                              let content = msg.text;
                              
                              if (msg.images && msg.images.length > 0) {
                                  type = 'IMAGE';
                                  content = 'Đã gửi hình ảnh mới';
                              } else if (msg.image) {
                                  type = 'IMAGE';
                                  content = 'Đã gửi hình ảnh';
                              }

                              handleNewNotification(newDoc, type, content, msg.sender);
                          }
                      });
                  }

                  // 2. Check for New Approvals/Defects (Red Alert)
                  const newApproveCount = newDoc.approvalItems?.length || 0;
                  const oldApproveCount = oldDoc.approvalItems?.length || 0;
                  
                  if (newApproveCount > oldApproveCount) {
                      // Get new items
                      const newItems = newDoc.approvalItems?.slice(oldApproveCount) || [];
                      newItems.forEach(item => {
                          // Only notify if status is pending (newly added)
                          if (item.status === 'pending') {
                              handleNewNotification(
                                  newDoc, 
                                  'APPROVAL', 
                                  `Yêu cầu: ${item.category} - ${item.content || 'Hình ảnh'}`, 
                                  item.reporter || 'User'
                              );
                          }
                      });
                  }
              });
          }

          // Update Reference
          prevDocumentsRef.current = fetchedDocs;

          // Update State
          setDocuments(prevDocs => {
              if (JSON.stringify(prevDocs) !== JSON.stringify(fetchedDocs)) {
                  return fetchedDocs;
              }
              return prevDocs;
          });
          
          if (isInitialLoad && fetchedDocs.length > 0 && !selectedDocId && user?.role === 'ADMIN') {
              const first = fetchedDocs[0];
              setSelectedProductKey(`${first.sender}|${first.title}`);
              setSelectedDocId(first.id);
          }
      } catch (error) {
          console.error("Failed to load documents", error);
          if (isInitialLoad) setDocuments(MOCK_DOCUMENTS);
      }
  };

  useEffect(() => {
      loadDocuments(true); 
      const interval = setInterval(() => {
          loadDocuments(false);
      }, 2000);
      return () => clearInterval(interval);
  }, [user]);

  // --- HEARTBEAT & LOGOUT HANDLER ---
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (user) {
          updatePresence(user.id);
          interval = setInterval(() => {
              updatePresence(user.id);
          }, 5000);
      }
      return () => { if (interval) clearInterval(interval); };
  }, [user]);

  const handleLogout = () => {
      if (user) {
          setOffline(user.id);
          setUser(null);
      }
  };

  // --- LOAD SYSTEM DATA ---
  const loadSystemData = async () => {
      setIsLoadingAnnouncements(true);
      try {
          let hasValidConfig = false;
          try {
              const saved = localStorage.getItem('storage_slots');
              if (saved) {
                  const slots = JSON.parse(saved);
                  hasValidConfig = slots.some((s: any) => s.isConnected && s.isInitialized);
              }
          } catch (e) { hasValidConfig = false; }
          setIsConfigMissing(!hasValidConfig);

          const result = await fetchAnnouncementsFromSheet();
          let finalAnnouncements = result.data;
          const alertId = 'sys_alert_config_missing';
          
          if (!hasValidConfig) {
               const alert: Announcement = {
                    id: alertId,
                    title: 'LỖI CẤU HÌNH: KHO LƯU TRỮ',
                    content: 'Hệ thống chưa tìm thấy kết nối đến Google Drive/Sheet. Dữ liệu sẽ không được lưu trực tuyến. Vui lòng vào Cấu hình ngay.',
                    date: new Date().toLocaleDateString('en-GB'),
                    author: 'SYSTEM',
                    readLog: [],
                    type: 'system'
                };
                if (!finalAnnouncements.find(a => a.id === alertId)) {
                    finalAnnouncements = [alert, ...finalAnnouncements];
                }
          } else {
               finalAnnouncements = finalAnnouncements.filter(a => a.id !== alertId);
          }

          setAnnouncements(finalAnnouncements);
          if (result.slotId !== 0) {
              setAnnouncementSource({ name: result.slotName, id: result.slotId });
          } else {
              setAnnouncementSource(null);
          }

      } catch (error) {
          console.error("Failed to load system data", error);
      } finally {
          setIsLoadingAnnouncements(false);
      }
  };

  useEffect(() => {
      loadSystemData();
      const interval = setInterval(loadSystemData, 5000);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
     const checkSolutions = () => {
         const missing: {docId: string, docTitle: string, defectId: string, defectContent: string}[] = [];
         documents.forEach(doc => {
             if (doc.defects) {
                 doc.defects.forEach(defect => {
                     if (!defect.solution || defect.solution.trim().length < 2) {
                         const content = defect.song || defect.in || defect.thanhPham || defect.kho || 'Lỗi chưa xác định';
                         missing.push({
                             docId: doc.id,
                             docTitle: doc.title,
                             defectId: defect.id,
                             defectContent: content
                         });
                     }
                 });
             }
         });
         setMissingSolutions(missing);
     };
     checkSolutions();
  }, [documents]);

  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0] || null;
  
  const filteredPOs = documents.filter(d => {
      if (!selectedProductKey) return false;
      const [sender, title] = selectedProductKey.split('|');
      return d.sender === sender && d.title === title;
  });

  const unreadAnnouncementsCount = user 
      ? announcements.filter(a => !a.readLog.some(log => log.userId === user.id)).length 
      : 0;

  const handleUpdateDocument = async (updatedDoc: Document) => {
    setDocuments(prevDocs => 
        prevDocs.map(d => d.id === updatedDoc.id ? updatedDoc : d)
    );
    await saveDocumentToSheet(updatedDoc);
  };

  const handleAddDocument = async (newDoc: Document) => {
      setDocuments(prev => [newDoc, ...prev]);
      if (user?.role === 'ADMIN') {
        setSelectedProductKey(`${newDoc.sender}|${newDoc.title}`);
        setSelectedDocId(newDoc.id);
      }
      await saveDocumentToSheet(newDoc);
      if(user) logAction(user, 'CREATE', 'DOCUMENT', newDoc.title, `Tạo hồ sơ mới PO: ${newDoc.productionOrder}`);
  };

  const handleFixSolution = (docId: string) => {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
          setSelectedProductKey(`${doc.sender}|${doc.title}`);
          setSelectedDocId(docId);
          setCurrentView('DOCUMENTS');
      }
  };

  const handleProductSelect = (sender: string, title: string) => {
      setSelectedProductKey(`${sender}|${title}`);
      const relatedDocs = documents.filter(d => d.sender === sender && d.title === title);
      if (relatedDocs.length > 0) {
           relatedDocs.sort((a, b) => {
              const dateA = a.date.split('/').reverse().join('');
              const dateB = b.date.split('/').reverse().join('');
              return dateB.localeCompare(dateA);
           });
           setSelectedDocId(relatedDocs[0].id);
      }
  };

  const handleDeleteGroup = async (sender: string, title: string) => {
      const relatedDocs = documents.filter(d => d.sender === sender && d.title === title);
      if (relatedDocs.length === 0) return;
      setDocuments(prev => prev.filter(d => !(d.sender === sender && d.title === title)));
      for (const doc of relatedDocs) {
          await deleteDocumentFromSheet(doc.id);
      }
      if (selectedProductKey === `${sender}|${title}`) {
          setSelectedProductKey('');
          setSelectedDocId('');
      }
      if(user) logAction(user, 'DELETE', 'DOCUMENT', title, `Xóa toàn bộ hồ sơ khách hàng ${sender}, sản phẩm ${title} (${relatedDocs.length} POs)`);
  };

  const handleEditGroup = async (oldSender: string, oldTitle: string, newSender: string, newTitle: string) => {
      const relatedDocs = documents.filter(d => d.sender === oldSender && d.title === oldTitle);
      const updatedDocs = documents.map(d => {
          if (d.sender === oldSender && d.title === oldTitle) {
              return { ...d, sender: newSender, title: newTitle };
          }
          return d;
      });
      setDocuments(updatedDocs);
      for (const doc of relatedDocs) {
          await saveDocumentToSheet({ ...doc, sender: newSender, title: newTitle });
      }
      if (selectedProductKey === `${oldSender}|${oldTitle}`) {
          setSelectedProductKey(`${newSender}|${newTitle}`);
      }
      if(user) logAction(user, 'UPDATE', 'DOCUMENT', newTitle, `Đổi tên SP từ ${oldTitle} -> ${newTitle}`);
  };

  const handleMarkAnnouncementAsRead = async (id: string) => {
      if (!user) return;
      const targetAnn = announcements.find(a => a.id === id);
      if (targetAnn && !targetAnn.readLog.some(log => log.userId === user.id)) {
          const newEntry = {
              userId: user.id,
              userName: user.name,
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' ' + new Date().toLocaleDateString('en-GB')
          };
          const updatedReadLog = [...targetAnn.readLog, newEntry];
          setAnnouncements(prev => prev.map(ann => ann.id === id ? { ...ann, readLog: updatedReadLog } : ann));
          await updateAnnouncementReadStatusInSheet(id, updatedReadLog);
      }
  };

  const handleCreateAnnouncement = async (ann: Announcement) => {
      setAnnouncements(prev => [ann, ...prev]);
      await saveAnnouncementToSheet(ann);
  };

  const handleUpdateAnnouncement = async (ann: Announcement) => {
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? ann : a));
      await saveAnnouncementToSheet(ann);
  };

  const handleDeleteAnnouncement = async (id: string) => {
      if(window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
          setAnnouncements(prev => prev.filter(a => a.id !== id));
          await deleteAnnouncementFromSheet(id);
      }
  };

  const handleClearUrgentNotification = (id: string) => {
      setDocNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === 'USER') {
    return (
        <>
            <GlobalToast toasts={toasts} onRemove={removeToast} onClick={handleAlertClick} />
            <MobileUserView 
                user={user} 
                onLogout={handleLogout} 
                documents={documents}
                onAddDocument={handleAddDocument}
                onUpdateDocument={handleUpdateDocument}
                announcements={announcements}
                onMarkAnnouncementAsRead={handleMarkAnnouncementAsRead}
                urgentNotifications={docNotifications} // Pass Urgent Data
                onClearUrgentNotification={handleClearUrgentNotification}
            />
        </>
    );
  }

  return (
    // UPDATED: Used h-[100dvh] instead of h-screen to fit exactly in mobile browser viewport
    <div className="flex flex-col h-[100dvh] w-full bg-soft-bg font-sans overflow-hidden">
      
      {/* GLOBAL TOAST NOTIFICATIONS */}
      <GlobalToast toasts={toasts} onRemove={removeToast} onClick={handleAlertClick} />

      {/* ALERT BUTTON (Persistent if Missed Toast) - LEGACY SUPPORT */}
      {activeAlertDocs.size > 0 && (
          <div className="fixed top-20 right-4 z-50 animate-bounce">
              <button 
                onClick={() => {
                    const firstDocId = Array.from(activeAlertDocs)[0];
                    if (typeof firstDocId === 'string') {
                        handleAlertClick(firstDocId);
                    }
                }}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center relative border-2 border-white transition-colors"
                title="Có hồ sơ đang chờ phản hồi!"
              >
                  <BellRing size={24} className="animate-wiggle" />
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white">
                      {activeAlertDocs.size}
                  </span>
              </button>
          </div>
      )}

      {/* Config Warning Banner */}
      {isConfigMissing && (
          <div className="bg-red-600 text-white px-4 py-2 text-sm font-bold flex justify-between items-center shadow-md z-[60] animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="animate-pulse"/>
                  <span>CẢNH BÁO: Chưa cấu hình kết nối Lưu trữ (Google Drive / Sheets). Dữ liệu sẽ không được lưu trực tuyến!</span>
              </div>
              <button 
                onClick={() => setCurrentView('SETTINGS')}
                className="bg-white text-red-600 px-3 py-1 rounded-full text-xs hover:bg-red-50 flex items-center gap-1 font-bold"
              >
                  <SettingsIcon size={12}/> Cấu hình ngay
              </button>
          </div>
      )}

      {/* STORAGE SLOT INDICATOR */}
      {!isConfigMissing && announcementSource && currentView === 'NOTIFICATIONS' && (
          <div className="bg-blue-600 text-white px-4 py-1 text-xs font-medium flex justify-center items-center gap-2 z-[60] shadow-sm">
             <Database size={12}/>
             <span>Đang tải dữ liệu Thông báo từ: <strong>{announcementSource.name}</strong> (Kho #{announcementSource.id})</span>
             {isLoadingAnnouncements && <Loader2 size={10} className="animate-spin"/>}
          </div>
      )}

      {/* MISSING SOLUTION WARNING LIST */}
      {missingSolutions.length > 0 && currentView !== 'SETTINGS' && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 z-50 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                 <div className="bg-orange-100 p-1 rounded text-orange-600 animate-pulse">
                     <ClipboardList size={16} />
                 </div>
                 <div className="flex flex-col">
                     <span className="text-xs font-bold text-orange-800">
                         CẦN KHẮC PHỤC: Có {missingSolutions.length} lỗi chưa nhập giải pháp!
                     </span>
                     <span className="text-[10px] text-orange-600 truncate max-w-md">
                         Vui lòng cập nhật giải pháp cho: {missingSolutions.map(m => m.docTitle).join(', ')}
                     </span>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button 
                    onClick={() => {
                        if(missingSolutions[0]) handleFixSolution(missingSolutions[0].docId);
                    }}
                    className="text-xs bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 font-bold flex items-center gap-1"
                 >
                    Cập nhật ngay <ArrowRight size={10} />
                 </button>
              </div>
          </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Sidebar Navigation */}
        <Sidebar 
            currentView={currentView} 
            onChangeView={setCurrentView} 
            onLogout={handleLogout}
            role={user.role}
            notificationCount={unreadAnnouncementsCount}
            urgentCount={docNotifications.length} // NEW
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* ADMIN VIEW 1: DASHBOARD */}
            {currentView === 'DASHBOARD' && <Dashboard />}

            {/* ADMIN VIEW: NOTIFICATIONS (Announcements) */}
            {currentView === 'NOTIFICATIONS' && (
                <Notifications 
                    user={user}
                    announcements={announcements}
                    onMarkAsRead={handleMarkAnnouncementAsRead}
                    onCreateAnnouncement={handleCreateAnnouncement}
                    onDeleteAnnouncement={handleDeleteAnnouncement}
                    onUpdateAnnouncement={handleUpdateAnnouncement}
                />
            )}

            {/* NEW: ADMIN VIEW: URGENT MESSAGES */}
            {currentView === 'URGENT' && (
                <UrgentNotifications 
                    notifications={docNotifications}
                    onSelectNotification={handleUrgentNotificationClick}
                />
            )}

            {/* ADMIN VIEW 2: DOCUMENTS */}
            {currentView === 'DOCUMENTS' && (
            <div className="flex-1 flex h-full relative">
                
                {/* Column 2: Product List */}
                <div className={`flex w-[250px] lg:w-[300px] h-full z-20 shadow-sm border-r border-gray-200 bg-white`}>
                    <DocumentList 
                        documents={documents} 
                        selectedProductKey={selectedProductKey}
                        onSelectProduct={handleProductSelect}
                        onOpenAddModal={() => setIsAddModalOpen(true)}
                        onDeleteGroup={handleDeleteGroup}
                        onEditGroup={handleEditGroup}
                    />
                </div>

                {/* Column 3: PO List */}
                <div className="flex w-[200px] lg:w-[250px] h-full z-10 bg-gray-50 border-r border-gray-200">
                    <POList 
                        productName={selectedProductKey ? selectedProductKey.split('|')[1] : ''}
                        documents={filteredPOs}
                        selectedDocId={selectedDocId}
                        onSelectPO={(id) => setSelectedDocId(id)}
                    />
                </div>

                {/* Column 4: Document Details */}
                <div className="flex flex-1 h-full bg-soft-bg overflow-hidden relative">
                     {filteredPOs.length === 0 ? (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                             <ClipboardList size={48} className="mb-2 opacity-20"/>
                             <p>Chọn sản phẩm để xem hồ sơ</p>
                         </div>
                     ) : (
                        selectedDoc && (
                            <DocumentDetail 
                                document={selectedDoc} 
                                onUpdateDocument={handleUpdateDocument}
                                currentUser={user} // UPDATED: Pass user prop
                            />
                        )
                     )}
                </div>
            </div>
            )}

            {/* ADMIN VIEW 3: EMPLOYEES */}
            {currentView === 'USERS' && <EmployeeManager />}
            
            {/* ADMIN VIEW 4: SETTINGS */}
            {currentView === 'SETTINGS' && <Settings />}

            {(currentView === 'TASKS' || currentView === 'REPORTS') && (
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <div className="text-center">
                        <p className="text-xl font-semibold">Chức năng đang phát triển</p>
                        <p className="text-sm">Vui lòng quay lại sau</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {isAddModalOpen && (
        <AddDocumentModal 
            onClose={() => setIsAddModalOpen(false)} 
            onAdd={handleAddDocument}
            currentUser={{ name: user.name, department: user.department || 'N/A' }}
        />
      )}
      
    </div>
  );
};

export default App;

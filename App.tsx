
import React, { useState, useEffect } from 'react';
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
import Settings from './components/Settings';
import FloatingChat from './components/FloatingChat'; // Import Floating Chat
import { MOCK_DOCUMENTS } from './constants';
import { Document, User, DefectEntry, Announcement } from './types';
import { Plus, AlertTriangle, Settings as SettingsIcon, ClipboardList, ArrowRight, Loader2, Database } from 'lucide-react';
import { updatePresence, setOffline, fetchAnnouncementsFromSheet, saveAnnouncementToSheet, updateAnnouncementReadStatusInSheet, deleteAnnouncementFromSheet, fetchDocumentsFromSheet, saveDocumentToSheet, deleteDocumentFromSheet, logAction } from './services/storageService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('DASHBOARD');
  const [documents, setDocuments] = useState<Document[]>([]); // Init empty, load from storage
  
  // Announcements State - Initialize Empty
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementSource, setAnnouncementSource] = useState<{name: string, id: number} | null>(null);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  // Selection State
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedProductKey, setSelectedProductKey] = useState<string>(''); // Format: "Sender|Title"

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigMissing, setIsConfigMissing] = useState(false);
  
  // State for missing solution notifications
  const [missingSolutions, setMissingSolutions] = useState<{docId: string, docTitle: string, defectId: string, defectContent: string}[]>([]);

  // --- LOAD DOCUMENTS FROM STORAGE ---
  const loadDocuments = async () => {
      try {
          const docs = await fetchDocumentsFromSheet();
          setDocuments(docs);
          
          // Set initial selection if needed
          if (docs.length > 0 && !selectedDocId) {
              const first = docs[0];
              setSelectedProductKey(`${first.sender}|${first.title}`);
              setSelectedDocId(first.id);
          }
      } catch (error) {
          console.error("Failed to load documents", error);
          setDocuments(MOCK_DOCUMENTS); // Fallback
      }
  };

  useEffect(() => {
      loadDocuments();
  }, []);

  // --- HEARTBEAT & LOGOUT HANDLER ---
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      
      if (user) {
          // Immediately update status
          updatePresence(user.id);
          
          // Send heartbeat every 5 seconds to stay "Online"
          interval = setInterval(() => {
              updatePresence(user.id);
          }, 5000);
      }

      return () => {
          if (interval) clearInterval(interval);
      };
  }, [user]);

  const handleLogout = () => {
      if (user) {
          setOffline(user.id);
          setUser(null);
      }
  };

  // --- LOAD SYSTEM DATA (Announcements & Config) ---
  const loadSystemData = async () => {
      setIsLoadingAnnouncements(true);
      try {
          // 1. Check Configuration
          let hasValidConfig = false;
          try {
              const saved = localStorage.getItem('storage_slots');
              if (saved) {
                  const slots = JSON.parse(saved);
                  hasValidConfig = slots.some((s: any) => s.isConnected && s.isInitialized);
              }
          } catch (e) { hasValidConfig = false; }
          setIsConfigMissing(!hasValidConfig);

          // 2. Fetch Announcements from Active Slot
          const result = await fetchAnnouncementsFromSheet();
          
          // System Alert Logic
          let finalAnnouncements = result.data;
          const alertId = 'sys_alert_config_missing';
          
          if (!hasValidConfig) {
               // Inject Alert if no config
               const alert: Announcement = {
                    id: alertId,
                    title: 'LỖI CẤU HÌNH: KHO LƯU TRỮ',
                    content: 'Hệ thống chưa tìm thấy kết nối đến Google Drive/Sheet. Dữ liệu sẽ không được lưu trực tuyến. Vui lòng vào Cấu hình ngay.',
                    date: new Date().toLocaleDateString('en-GB'),
                    author: 'SYSTEM',
                    readLog: [],
                    type: 'system' // Mark as System Alert
                };
                // Deduplicate
                if (!finalAnnouncements.find(a => a.id === alertId)) {
                    finalAnnouncements = [alert, ...finalAnnouncements];
                }
          } else {
               // Remove alert if config valid
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

  // Load on mount and when view changes to Settings (to refresh on exit)
  useEffect(() => {
      loadSystemData();
      
      // Polling for Config Changes (Simulating other admins changing config)
      const interval = setInterval(loadSystemData, 5000);
      return () => clearInterval(interval);
  }, []);


  // Check Missing Solutions (Local Doc Logic)
  useEffect(() => {
     const checkSolutions = () => {
         // Missing Solutions Check (Quét dữ liệu lỗi)
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

  // Derived state for selected document to ensure we always have the latest version
  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0] || null;
  
  // Derived state for PO List (Filtered by selected Product)
  const filteredPOs = documents.filter(d => {
      if (!selectedProductKey) return false;
      const [sender, title] = selectedProductKey.split('|');
      return d.sender === sender && d.title === title;
  });

  // Calculate notification count (UNREAD ANNOUNCEMENTS)
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

  // --- DELETE & EDIT GROUP LOGIC (COL 2) ---
  const handleDeleteGroup = async (sender: string, title: string) => {
      // Find all POs matching this group
      const relatedDocs = documents.filter(d => d.sender === sender && d.title === title);
      if (relatedDocs.length === 0) return;

      // Optimistic UI Update
      setDocuments(prev => prev.filter(d => !(d.sender === sender && d.title === title)));
      
      // Update Storage
      for (const doc of relatedDocs) {
          await deleteDocumentFromSheet(doc.id);
      }
      
      // Clear selection if current selection was deleted
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
      
      // Update Storage
      for (const doc of relatedDocs) {
          await saveDocumentToSheet({ ...doc, sender: newSender, title: newTitle });
      }

      // Update Selection Key
      if (selectedProductKey === `${oldSender}|${oldTitle}`) {
          setSelectedProductKey(`${newSender}|${newTitle}`);
      }
      if(user) logAction(user, 'UPDATE', 'DOCUMENT', newTitle, `Đổi tên SP từ ${oldTitle} -> ${newTitle}`);
  };

  // --- ANNOUNCEMENT HANDLERS (PERSISTENT) ---
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
          
          setAnnouncements(prev => prev.map(ann => 
              ann.id === id ? { ...ann, readLog: updatedReadLog } : ann
          ));

          await updateAnnouncementReadStatusInSheet(id, updatedReadLog);
      }
  };

  const handleCreateAnnouncement = async (ann: Announcement) => {
      setAnnouncements(prev => [ann, ...prev]);
      await saveAnnouncementToSheet(ann);
  };

  const handleUpdateAnnouncement = async (ann: Announcement) => {
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? ann : a));
      await saveAnnouncementToSheet(ann); // Save handles update
  };

  const handleDeleteAnnouncement = async (id: string) => {
      if(window.confirm('Bạn có chắc muốn xóa thông báo này?')) {
          setAnnouncements(prev => prev.filter(a => a.id !== id));
          await deleteAnnouncementFromSheet(id);
      }
  };

  // 1. If not logged in, show Login Screen
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // 2. If User Role is USER, show Mobile First View
  if (user.role === 'USER') {
    return (
        <>
            <MobileUserView 
                user={user} 
                onLogout={handleLogout} 
                documents={documents}
                onAddDocument={handleAddDocument}
                onUpdateDocument={handleUpdateDocument}
                announcements={announcements}
                onMarkAnnouncementAsRead={handleMarkAnnouncementAsRead}
            />
            <FloatingChat user={user} />
        </>
    );
  }

  // 3. If User Role is ADMIN, show Dashboard/Desktop View with Sidebar
  return (
    <div className="flex flex-col h-screen w-full bg-soft-bg font-sans overflow-hidden">
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

      {/* STORAGE SLOT INDICATOR (If not missing config) */}
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
                    onClick={() => handleFixSolution(missingSolutions[0].docId)}
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
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* ADMIN VIEW 1: DASHBOARD */}
            {currentView === 'DASHBOARD' && <Dashboard />}

            {/* ADMIN VIEW: NOTIFICATIONS (RENAMED TO ANNOUNCEMENTS) */}
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

            {/* ADMIN VIEW 2: DOCUMENTS (4-COLUMN LAYOUT) */}
            {currentView === 'DOCUMENTS' && (
            <div className="flex-1 flex h-full relative">
                
                {/* Column 2: Product List (Grouped) */}
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

                {/* Column 3: PO List (Versions) - NEW */}
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
                     {/* Empty State if no PO selected */}
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
                            />
                        )
                     )}
                </div>
            </div>
            )}

            {/* ADMIN VIEW 3: EMPLOYEES */}
            {currentView === 'USERS' && <EmployeeManager />}
            
            {/* ADMIN VIEW 4: SETTINGS (Google Drive/Sheets) */}
            {currentView === 'SETTINGS' && <Settings />}

            {/* Placeholder for other views */}
            {(currentView === 'TASKS' || currentView === 'REPORTS') && (
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <div className="text-center">
                        <p className="text-xl font-semibold">Chức năng đang phát triển</p>
                        <p className="text-sm">Vui lòng quay lại sau</p>
                    </div>
                </div>
            )}

            {/* Floating Chat for Admin/Desktop as well */}
            <FloatingChat user={user} />
        </div>
      </div>

      {/* Modal Overlay */}
      {isAddModalOpen && (
        <AddDocumentModal onClose={() => setIsAddModalOpen(false)} />
      )}
      
    </div>
  );
};

export default App;

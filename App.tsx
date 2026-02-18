
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
import { MOCK_DOCUMENTS, MOCK_ANNOUNCEMENTS } from './constants';
import { Document, User, DefectEntry, Announcement } from './types';
import { Plus, AlertTriangle, Settings as SettingsIcon, ClipboardList, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('DASHBOARD');
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  
  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

  // Selection State
  const [selectedDocId, setSelectedDocId] = useState<string>(MOCK_DOCUMENTS[0].id);
  const [selectedProductKey, setSelectedProductKey] = useState<string>(''); // Format: "Sender|Title"

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigMissing, setIsConfigMissing] = useState(false);
  
  // State for missing solution notifications
  const [missingSolutions, setMissingSolutions] = useState<{docId: string, docTitle: string, defectId: string, defectContent: string}[]>([]);

  // Init selection based on first doc
  useEffect(() => {
      if (documents.length > 0 && !selectedProductKey) {
          const first = documents[0];
          setSelectedProductKey(`${first.sender}|${first.title}`);
          setSelectedDocId(first.id);
      }
  }, []);

  // Check storage configuration and Missing Solutions on mount/update
  useEffect(() => {
     const checkSystem = () => {
         // 1. Config Check (Revised for Auto-Init)
         try {
             const saved = localStorage.getItem('storage_slots');
             if (!saved) {
                 setIsConfigMissing(true);
             } else {
                 const slots = JSON.parse(saved);
                 const activeSlot = slots.find((s: any) => s.isActive);
                 // Check if active slot exists AND is initialized (created files)
                 if (!activeSlot || !activeSlot.isInitialized) {
                     setIsConfigMissing(true);
                 } else {
                     setIsConfigMissing(false);
                 }
             }
         } catch (e) {
             setIsConfigMissing(true);
         }

         // 2. Missing Solutions Check (Quét dữ liệu lỗi)
         const missing: {docId: string, docTitle: string, defectId: string, defectContent: string}[] = [];
         documents.forEach(doc => {
             if (doc.defects) {
                 doc.defects.forEach(defect => {
                     // Check if solution is empty or essentially empty
                     if (!defect.solution || defect.solution.trim().length < 2) {
                         // Determine content for display
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
     
     checkSystem();
     const interval = setInterval(checkSystem, 5000); // Check every 5s
     return () => clearInterval(interval);
  }, [documents]);

  // Derived state for selected document to ensure we always have the latest version
  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];
  
  // Derived state for PO List (Filtered by selected Product)
  const filteredPOs = documents.filter(d => {
      if (!selectedProductKey) return false;
      const [sender, title] = selectedProductKey.split('|');
      return d.sender === sender && d.title === title;
  });

  // Calculate notification count (UNREAD ANNOUNCEMENTS)
  const unreadAnnouncementsCount = user ? announcements.filter(a => !a.readBy.includes(user.id)).length : 0;

  const handleUpdateDocument = (updatedDoc: Document) => {
    setDocuments(prevDocs => 
        prevDocs.map(d => d.id === updatedDoc.id ? updatedDoc : d)
    );
  };

  const handleAddDocument = (newDoc: Document) => {
      setDocuments(prev => [newDoc, ...prev]);
      // If Admin is adding, select it immediately
      if (user?.role === 'ADMIN') {
        setSelectedProductKey(`${newDoc.sender}|${newDoc.title}`);
        setSelectedDocId(newDoc.id);
      }
  };

  const handleSelectDocumentFromNotification = (doc: Document) => {
      setSelectedProductKey(`${doc.sender}|${doc.title}`);
      setSelectedDocId(doc.id);
      setCurrentView('DOCUMENTS');
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
      // Auto select the latest PO for this product
      const relatedDocs = documents.filter(d => d.sender === sender && d.title === title);
      if (relatedDocs.length > 0) {
           // Sort descending date
           relatedDocs.sort((a, b) => {
              const dateA = a.date.split('/').reverse().join('');
              const dateB = b.date.split('/').reverse().join('');
              return dateB.localeCompare(dateA);
           });
           setSelectedDocId(relatedDocs[0].id);
      }
  };

  // --- ANNOUNCEMENT HANDLERS ---
  const handleMarkAnnouncementAsRead = (id: string) => {
      if (!user) return;
      setAnnouncements(prev => prev.map(ann => {
          if (ann.id === id && !ann.readBy.includes(user.id)) {
              return { ...ann, readBy: [...ann.readBy, user.id] };
          }
          return ann;
      }));
  };

  const handleCreateAnnouncement = (ann: Announcement) => {
      setAnnouncements(prev => [ann, ...prev]);
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
                onLogout={() => setUser(null)} 
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
          <div className="bg-red-600 text-white px-4 py-2 text-sm font-bold flex justify-between items-center shadow-md z-[60]">
              <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="animate-pulse"/>
                  <span>CẢNH BÁO: Chưa cấu hình kết nối Lưu trữ (Google Drive / Sheets). Dữ liệu sẽ không được lưu trực tuyến!</span>
              </div>
              <button 
                onClick={() => setCurrentView('SETTINGS')}
                className="bg-white text-red-600 px-3 py-1 rounded-full text-xs hover:bg-red-50 flex items-center gap-1"
              >
                  <SettingsIcon size={12}/> Cấu hình ngay
              </button>
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
            onLogout={() => setUser(null)}
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
                        <DocumentDetail 
                            document={selectedDoc} 
                            onUpdateDocument={handleUpdateDocument}
                        />
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

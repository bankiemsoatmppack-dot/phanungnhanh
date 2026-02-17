
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DocumentList from './components/DocumentList';
import DocumentDetail from './components/DocumentDetail';
import Dashboard from './components/Dashboard';
import AddDocumentModal from './components/AddDocumentModal';
import Login from './components/Login';
import MobileUserView from './components/MobileUserView';
import EmployeeManager from './components/EmployeeManager';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import { MOCK_DOCUMENTS } from './constants';
import { Document, User } from './types';
import { Plus, AlertTriangle, Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('DASHBOARD');
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [selectedDocId, setSelectedDocId] = useState<string>(MOCK_DOCUMENTS[0].id);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigMissing, setIsConfigMissing] = useState(false);

  // Check storage configuration on mount
  useEffect(() => {
     const checkConfig = () => {
         try {
             const saved = localStorage.getItem('storage_slots');
             if (!saved) {
                 setIsConfigMissing(true);
                 return;
             }
             const slots = JSON.parse(saved);
             const activeSlot = slots.find((s: any) => s.isActive);
             if (!activeSlot || !activeSlot.driveFolderId || !activeSlot.sheetId) {
                 setIsConfigMissing(true);
             } else {
                 setIsConfigMissing(false);
             }
         } catch (e) {
             setIsConfigMissing(true);
         }
     };
     
     checkConfig();
     // Optional: Poll every few seconds or listen to storage events if needed
     const interval = setInterval(checkConfig, 2000);
     return () => clearInterval(interval);
  }, []);

  // Derived state for selected document to ensure we always have the latest version
  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  // Calculate notification count (pending approval items)
  const notificationCount = documents.reduce((acc, doc) => {
      return acc + (doc.approvalItems || []).filter(item => item.status === 'pending').length;
  }, 0);

  const handleUpdateDocument = (updatedDoc: Document) => {
    setDocuments(prevDocs => 
        prevDocs.map(d => d.id === updatedDoc.id ? updatedDoc : d)
    );
  };

  const handleAddDocument = (newDoc: Document) => {
      setDocuments(prev => [newDoc, ...prev]);
      // If Admin is adding, select it immediately
      if (user?.role === 'ADMIN') {
        setSelectedDocId(newDoc.id);
      }
  };

  const handleSelectDocumentFromNotification = (doc: Document) => {
      setSelectedDocId(doc.id);
      setCurrentView('DOCUMENTS');
  };

  // 1. If not logged in, show Login Screen
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // 2. If User Role is USER, show Mobile First View
  if (user.role === 'USER') {
    return (
        <MobileUserView 
            user={user} 
            onLogout={() => setUser(null)} 
            documents={documents}
            onAddDocument={handleAddDocument}
            onUpdateDocument={handleUpdateDocument}
        />
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

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
            currentView={currentView} 
            onChangeView={setCurrentView} 
            onLogout={() => setUser(null)}
            role={user.role}
            notificationCount={notificationCount}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
            
            {/* ADMIN VIEW 1: DASHBOARD */}
            {currentView === 'DASHBOARD' && <Dashboard />}

            {/* ADMIN VIEW: NOTIFICATIONS */}
            {currentView === 'NOTIFICATIONS' && (
                <Notifications 
                    documents={documents} 
                    onSelectDocument={handleSelectDocumentFromNotification}
                />
            )}

            {/* ADMIN VIEW 2: DOCUMENTS */}
            {currentView === 'DOCUMENTS' && (
            <div className="flex-1 flex h-full relative">
                {/* Column 2: Document List */}
                <div className={`flex w-full md:w-[350px] lg:w-[400px] h-full z-10 shadow-lg`}>
                    <DocumentList 
                        documents={documents} 
                        selectedId={selectedDocId}
                        onSelect={(doc) => setSelectedDocId(doc.id)}
                        onOpenAddModal={() => setIsAddModalOpen(true)}
                    />
                </div>
                {/* Column 3: Document Details */}
                <div className="hidden md:flex flex-1 p-4 h-full bg-soft-bg overflow-hidden">
                    <DocumentDetail 
                        document={selectedDoc} 
                        onUpdateDocument={handleUpdateDocument}
                    />
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
        </div>
      </div>

      {/* Modal Overlay */}
      {isAddModalOpen && (
        <AddDocumentModal onClose={() => setIsAddModalOpen(false)} />
      )}
      
      {/* Floating Action Button for Adding Document in Admin View */}
      {currentView === 'DOCUMENTS' && (
          <button 
             onClick={() => setIsAddModalOpen(true)}
             className="hidden md:flex absolute bottom-8 left-28 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-transform hover:scale-105 z-50 items-center justify-center"
             title="Thêm văn bản mới"
          >
             <Plus size={24} />
          </button>
      )}

    </div>
  );
};

export default App;


import { DriveSlot, ChatMessage, DefectEntry, Document } from '../types';

// Constants
const HARD_LIMIT_BYTES = 15 * 1024 * 1024 * 1024; // 15GB (Google Drive Limit)
const SAFE_LIMIT_BYTES = 11 * 1024 * 1024 * 1024; // 11GB (Safe Threshold for new docs)

// Helper: Get all slots
const getSlots = (): DriveSlot[] => {
    const saved = localStorage.getItem('storage_slots');
    return saved ? JSON.parse(saved) : [];
};

// Helper: Save slots back
const saveSlots = (slots: DriveSlot[]) => {
    localStorage.setItem('storage_slots', JSON.stringify(slots));
};

// Helper: Increment Usage (Simulation)
const incrementUsage = (slotId: number, bytesToAdd: number) => {
    const slots = getSlots();
    const updated = slots.map(s => {
        if (s.id === slotId) {
            const newUsed = (s.usedBytes || 0) + bytesToAdd;
            let newStatus: DriveSlot['status'] = s.status;
            
            // Update Status based on thresholds
            if (newUsed >= HARD_LIMIT_BYTES) newStatus = 'full';
            else if (newUsed >= SAFE_LIMIT_BYTES) newStatus = 'active'; // Still active but passed safe limit
            
            return { 
                ...s, 
                usedBytes: newUsed,
                status: newStatus 
            } as DriveSlot;
        }
        return s;
    });
    saveSlots(updated);
};

// --- LOAD BALANCING: SELECT SLOT FOR NEW DOCUMENT ---
export const assignSlotForNewDocument = (): number | undefined => {
    const slots = getSlots();
    
    // Logic: Find first connected slot where usedBytes < SAFE_LIMIT (11GB)
    // We do NOT assign new docs to slots that are in the 11GB-15GB buffer zone.
    const availableSlot = slots.find(s => 
        s.isConnected && 
        s.isInitialized && 
        (s.usedBytes || 0) < SAFE_LIMIT_BYTES // Use Safe Limit here
    );
    
    if (availableSlot) {
        console.log(`[Storage] Assigned new document to Repository #${availableSlot.id} (${availableSlot.name}) - Capacity: ${(availableSlot.usedBytes/1024/1024/1024).toFixed(2)}GB`);
        return availableSlot.id;
    }
    
    // Fallback: If all are > 11GB but < 15GB, and user manually forced connection, maybe allow? 
    // For now, strict safety first.
    console.warn("[Storage] No repositories found with safe capacity (<11GB). Please add a new storage slot!");
    return undefined;
};

// --- SYSTEM INITIALIZATION (HYBRID) ---
export const initializeSystemSlot = async (slotId: number, userDriveLink: string): Promise<Partial<DriveSlot>> => {
    console.log(`[System] Initializing Slot ${slotId}...`);
    
    // 1. Validate Drive Link
    if (!userDriveLink || !userDriveLink.includes('drive.google.com')) {
        throw new Error("Link Google Drive không hợp lệ!");
    }

    // 2. Extract Folder ID
    let folderId = userDriveLink;
    const match = userDriveLink.match(/folders\/([-a-zA-Z0-9_]+)/);
    if (match && match[1]) {
        folderId = match[1];
    }
    console.log(`[Drive] Using User Folder ID: ${folderId}`);

    // 3. Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 4. Mock Create Google Sheet
    const newSheetId = `sheet_${Date.now()}_auto_${slotId}`;
    console.log(`[Sheets] Created Master Spreadsheet: ${newSheetId}`);

    // 5. Mock Create Headers
    const chatHeaders = ['STT', 'THỜI GIAN', 'NHÂN VIÊN', 'BỘ PHẬN', 'NỘI DUNG'];
    localStorage.setItem(`sheet_chat_${newSheetId}_headers`, JSON.stringify(chatHeaders));
    
    const hosoHeaders = [
        'STT', 'THỜI GIAN', 'TÊN SẢN PHẨM', 'PHIẾU SẢN XUẤT', 'BỘ PHẬN', 
        'NỘI DUNG LỖI', 'KHẮC PHỤC', 'GHI CHÚ', 'NGƯỜI DUYỆT',
        'HÌNH ẢNH 1', 'HÌNH ẢNH 2', 'HÌNH ẢNH 3', 'HÌNH ẢNH 4', 'HÌNH ẢNH 5',
        'HÌNH ẢNH 6', 'HÌNH ẢNH 7', 'HÌNH ẢNH 8', 'HÌNH ẢNH 9', 'HÌNH ẢNH 10'
    ];
    localStorage.setItem(`sheet_hoso_${newSheetId}_headers`, JSON.stringify(hosoHeaders));

    return {
        driveFolderLink: userDriveLink,
        driveFolderId: folderId,
        sheetId: newSheetId,
        isInitialized: true,
        isConnected: true, // Auto connect on init
        totalCapacityBytes: HARD_LIMIT_BYTES,
        usedBytes: 1024 * 1024 * 100, // Start with 100MB used (system overhead)
        lastSync: new Date().toLocaleString(),
        accountName: `User Account (Repo ${slotId})`
    };
};

// --- REALISTIC UPLOAD (ROUTING AWARE) ---
export const uploadToGoogleDrive = async (file: File | Blob, filename: string, targetSlotId?: number): Promise<string> => {
  const slots = getSlots();
  // Find the specific slot assigned to this doc, OR fallback to any active slot
  // Note: For existing docs, we ALLOW upload even if > 11GB, as long as < 15GB (Buffer zone)
  const slot = slots.find(s => s.id === targetSlotId) || slots.find(s => s.isConnected && s.isInitialized);

  if (!slot) {
      console.warn('No valid storage slot found for upload. Using temporary local URL...');
      return URL.createObjectURL(file);
  }

  // Check Hard Limit
  if (slot.usedBytes >= HARD_LIMIT_BYTES) {
      alert(`KHO #${slot.id} ĐÃ ĐẦY (15GB)! Không thể tải lên file mới. Vui lòng liên hệ Admin.`);
      return '';
  }

  console.log(`[Drive] Uploading ${filename} to Repo #${slot.id} (Folder: ${slot.driveFolderId})...`);
  
  // Simulation Latency
  await new Promise(resolve => setTimeout(resolve, 800));

  // Update Capacity (~200KB per image for demo)
  incrementUsage(slot.id, 200 * 1024);

  return `https://drive.google.com/file/d/mock_id_${Date.now()}_${Math.random().toString(36).substr(2,5)}/view`;
};

// --- SHEET 1: CHAT ONLINE (ROUTING AWARE) ---
export const saveChatToSheet = async (msg: ChatMessage, doc: Document) => {
    const slots = getSlots();
    // ROUTING: Use the doc's assigned slot, or fallback
    const targetSlotId = doc.storageSlotId || assignSlotForNewDocument();
    
    // Check if that slot exists and is connected
    const slot = slots.find(s => s.id === targetSlotId);

    if (!slot || !slot.isConnected || !slot.isInitialized) {
        console.warn(`[Sheet-CHAT] Cannot save. Repo #${targetSlotId} is missing or disconnected.`);
        return;
    }

    const rowData = [
        Date.now(),
        msg.timestamp,
        msg.sender,
        msg.department || 'N/A',
        msg.text
    ];

    console.log(`[Sheet-CHAT] Saving to Repo #${slot.id} (Sheet ID: ${slot.sheetId})`, rowData);
    
    // Save locally to mock the sheet row
    const key = `sheet_data_chat_${slot.sheetId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([...existing, rowData]));

    // Update Capacity (~1KB per text row)
    incrementUsage(slot.id, 1024);
};

// --- SHEET 2: HOSO (ROUTING AWARE) ---
export const saveHoSoToSheet = async (
    doc: Document, 
    entry: DefectEntry, 
    approver: string, 
    department: string,
    images: string[]
) => {
    const slots = getSlots();
    // ROUTING
    const targetSlotId = doc.storageSlotId || assignSlotForNewDocument();
    const slot = slots.find(s => s.id === targetSlotId);

    if (!slot || !slot.isConnected || !slot.isInitialized) {
         console.warn(`[Sheet-HOSO] Cannot save. Repo #${targetSlotId} is missing or disconnected.`);
         return false;
    }
    
    // Pad Images
    const imageColumns = Array(10).fill('');
    images.forEach((img, index) => {
        if (index < 10) imageColumns[index] = img;
    });

    const rowData = [
        entry.id,
        entry.date,
        doc.title,
        entry.productionOrder,
        department,
        entry.song || entry.in || entry.thanhPham || entry.kho || 'Lỗi chung',
        entry.solution,
        '',
        approver,
        ...imageColumns
    ];

    console.log(`[Sheet-HOSO] Saving to Repo #${slot.id} (Sheet ID: ${slot.sheetId})`, rowData);

    const key = `sheet_data_hoso_${slot.sheetId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([...existing, rowData]));

    // Update Capacity (~5KB per row metadata)
    incrementUsage(slot.id, 5 * 1024);

    return true;
};

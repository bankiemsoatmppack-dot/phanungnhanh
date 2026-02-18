
export type TabType = 'OVERVIEW' | 'SPECS' | 'CHAT' | 'APPROVE';
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface Employee {
  id: string;
  stt: number;
  name: string;
  username: string;
  password?: string; // In real app, never store plain text
  department: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ReadLogEntry {
    userId: string;
    userName: string;
    timestamp: string; // DD/MM/YYYY HH:mm
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string; // DD/MM/YYYY
  author: string;
  readLog: ReadLogEntry[]; // Replaces simple string[] to track time
}

export interface MobileTask {
  id: string;
  title: string; // Mục con (Tên sản phẩm)
  sender?: string; // Mục lớn (Khách hàng)
  sku: string;
  code: string; // Phiếu sản xuất
  date: string;
  status: 'pending' | 'completed';
  notificationCount: number;
  isMyTask: boolean;
  type: 'folder' | 'file';
}

export interface PackagingSpecs {
  dimensions: string; // e.g., 300x200x150 mm
  material: string; // e.g., Giấy Kraft, 5 lớp
  flute: string; // e.g., Sóng BC
  printTech: string; // e.g., Flexo 4 màu
  colors: string[]; // e.g., ['Pantone 286C', 'Black']
  netWeight: string; // e.g., 250g
}

export interface DefectEntry {
  id: string;
  date: string;
  productionOrder: string;
  song?: string;
  songImages?: string[];
  in?: string;
  inImages?: string[];
  thanhPham?: string;
  thanhPhamImages?: string[];
  kho?: string;
  khoImages?: string[];
  solution: string;
  reporter?: string; // Who reported the issue
  isSynced?: boolean; // Track if saved to Google Sheet
  missingSolution?: boolean; // Track if solution needs update
}

export interface SpecLogEntry {
  id: string;
  date: string;
  productionOrder: string;
  content: string;
  images?: string[];
  result: string;
  reporter?: string; // Who checked/reported
}

export interface ApprovalItem {
  id: string;
  sourceId: string;
  content: string;
  image?: string;
  category: 'SÓNG' | 'IN' | 'THÀNH PHẨM' | 'KHO' | 'TCKT' | 'KHÁC';
  solution: string;
  timestamp: string;
  status: 'pending' | 'approved';
  reporter?: string; // Name of sender from chat
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  image?: string; // Deprecated, kept for backward compatibility
  images?: string[]; // New: Support multiple images
  timestamp: string;
  isMe: boolean;
  role?: string; // 'Client', 'Quản lý', etc.
  department?: string; // Added for Sheet Chat
}

export interface Document {
  id: string;
  title: string; // Product Name (e.g., Thùng Tiger)
  abstract: string; // Description
  code: string; // SKU / Product Code
  productionOrder?: string; // Phiếu sản xuất (Mutable)
  date: string; // Created Date
  sender: string; // Customer Name (HEINEKEN, PEPSICO)
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  urgency: 'normal' | 'urgent' | 'critical';
  type: 'incoming' | 'outgoing' | 'internal';
  attachmentName?: string;
  department: string;
  handler: string; // Sale/Tech person in charge
  specs?: PackagingSpecs; // Technical Specs
  defects?: DefectEntry[]; // Log of defects
  specLogs?: SpecLogEntry[]; // Log of spec checks
  approvalItems?: ApprovalItem[]; // Items saved from chat
  messages?: ChatMessage[]; // Chat history specific to this document
  
  // NEW: Routing field to know which Google Drive/Sheet this doc belongs to
  storageSlotId?: number; 
}

export interface ChartDataPoint {
  name: string;
  value: number;
  value2?: number; // For multi-line
  value3?: number;
}

export interface DriveSlot {
  id: number;
  name: string;
  driveFolderLink?: string; // User manually inputs this
  driveFolderId: string; // Extracted or same as link
  sheetId: string; // System generated
  
  // Capacity Management
  totalCapacityBytes: number; // e.g. 15GB = 16106127360
  usedBytes: number; // Current usage
  
  isConnected: boolean; // Replaces 'isActive'. Multiple slots can be connected.
  status: 'ready' | 'full' | 'error' | 'active';
  isInitialized: boolean; // True if Folder and Sheet are created
  lastSync?: string; // Timestamp
  accountName?: string; // Account connected
}

export interface StorageConfig {
  apiKey: string;
  clientId: string;
  slots: DriveSlot[];
}

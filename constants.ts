
import { Document, ChatMessage, ChartDataPoint, Employee, MobileTask, Announcement, DriveSlot } from './types';

// Helper for default permissions
const PERM_FULL = { view: true, add: true, edit: true, delete: true };
const PERM_READ_ONLY = { view: true, add: false, edit: false, delete: false };
const PERM_WORKER = { view: true, add: true, edit: false, delete: false }; // Workers can add (chat/report) but not edit system data

// --- SYSTEM MASTER CONFIGURATION (Simulating Server Data) ---
// This ensures all devices see the same configuration immediately
export const DEFAULT_STORAGE_SLOTS: DriveSlot[] = [
    {
        id: 1,
        name: 'KHO TỔNG (MPPACK-MAIN)',
        driveFolderLink: 'https://drive.google.com/drive/folders/mppack-master-folder',
        driveFolderId: 'mppack-master-folder',
        sheetId: 'sheet_master_production_v1',
        totalCapacityBytes: 15 * 1024 * 1024 * 1024, // 15GB
        usedBytes: 8.5 * 1024 * 1024 * 1024, // ~8.5GB Used (Simulated)
        isConnected: true,
        status: 'active',
        isInitialized: true,
        lastSync: 'Vừa xong',
        accountName: 'admin@mppack.vn'
    },
    {
        id: 2,
        name: 'KHO DỰ PHÒNG 01',
        driveFolderLink: 'https://drive.google.com/drive/folders/backup-01',
        driveFolderId: 'backup-01',
        sheetId: 'sheet_backup_v1',
        totalCapacityBytes: 15 * 1024 * 1024 * 1024,
        usedBytes: 0,
        isConnected: true,
        status: 'ready',
        isInitialized: true,
        lastSync: '24/11/2023',
        accountName: 'backup1@mppack.vn'
    },
    {
        id: 3,
        name: 'Kho Dữ Liệu 3',
        driveFolderLink: '',
        driveFolderId: '',
        sheetId: '',
        totalCapacityBytes: 15 * 1024 * 1024 * 1024,
        usedBytes: 0,
        isConnected: false,
        status: 'ready',
        isInitialized: false
    },
    {
        id: 4,
        name: 'Kho Dữ Liệu 4',
        driveFolderLink: '',
        driveFolderId: '',
        sheetId: '',
        totalCapacityBytes: 15 * 1024 * 1024 * 1024,
        usedBytes: 0,
        isConnected: false,
        status: 'ready',
        isInitialized: false
    }
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', stt: 1, name: 'Nguyễn Văn A', username: 'NV001', department: 'IN', position: 'WORKER', permissions: PERM_WORKER, status: 'active', createdAt: '20/10/2023' },
  { id: '2', stt: 2, name: 'Trần Thị B', username: 'NV002', department: 'KHO', position: 'WORKER', permissions: PERM_WORKER, status: 'active', createdAt: '21/10/2023' },
  { id: '3', stt: 3, name: 'Lê Văn C', username: 'NV003', department: 'KCS', position: 'WORKER', permissions: PERM_WORKER, status: 'inactive', createdAt: '22/10/2023' },
  { id: '4', stt: 4, name: 'Phạm Thị D', username: 'NV004', department: 'SX', position: 'WORKER', permissions: PERM_WORKER, status: 'active', createdAt: '23/10/2023' },
  { id: '5', stt: 5, name: 'Hoàng Văn E', username: 'NV005', department: 'GIAO NHẬN', position: 'WORKER', permissions: PERM_WORKER, status: 'active', createdAt: '24/10/2023' },
  
  // High Level Roles
  { id: '10', stt: 10, name: 'Ông Giám Đốc', username: 'giamdoc', department: 'BAN GIÁM ĐỐC', position: 'DIRECTOR', permissions: PERM_READ_ONLY, status: 'active', createdAt: '01/01/2023' },
  { id: '11', stt: 11, name: 'Ông Phó GĐ', username: 'phogiamdoc', department: 'BAN GIÁM ĐỐC', position: 'DEPUTY_DIRECTOR', permissions: PERM_FULL, status: 'active', createdAt: '01/01/2023' },
  { id: '12', stt: 12, name: 'Trưởng Phòng KCS', username: 'tpkcs', department: 'KCS', position: 'QA_MANAGER', permissions: PERM_FULL, status: 'active', createdAt: '01/05/2023' },
  { id: '13', stt: 13, name: 'Trưởng Phòng SX', username: 'tpsx', department: 'SX', position: 'PROD_MANAGER', permissions: PERM_FULL, status: 'active', createdAt: '01/05/2023' },
  { id: '14', stt: 14, name: 'IT Admin', username: 'it', department: 'IT', position: 'IT_ADMIN', permissions: PERM_READ_ONLY, status: 'active', createdAt: '01/01/2023' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    {
        id: 'a1',
        title: 'Lịch đón đoàn khách HEINEKEN',
        content: 'Sáng mai 08:00 ngày 25/11 có đoàn kiểm tra chất lượng từ Heineken. Yêu cầu các bộ phận 5S khu vực sản xuất sạch sẽ.',
        date: '24/11/2023',
        author: 'Ban Giám Đốc',
        readLog: [
            { userId: '2', userName: 'Trần Thị B', timestamp: '08:15 24/11/2023' },
            { userId: '4', userName: 'Phạm Thị D', timestamp: '09:30 24/11/2023' }
        ]
    },
    {
        id: 'a2',
        title: 'Thông báo bảo trì máy In Flexo 01',
        content: 'Máy In Flexo 01 sẽ dừng bảo trì từ 12:00 đến 14:00 hôm nay. Kế hoạch sản xuất đã được điều chỉnh.',
        date: '24/11/2023',
        author: 'Phòng Kỹ Thuật',
        readLog: []
    }
];

export const MOCK_TASKS: MobileTask[] = [
  {
    id: '1',
    title: 'Thùng Tiger Crystal 24 lon 330ml',
    sender: 'HEINEKEN VIETNAM',
    sku: 'SKU-TIGER-CRYSTAL-24',
    code: 'LSX-2023-11-001',
    date: '20/11/2023',
    status: 'completed',
    notificationCount: 3,
    isMyTask: true,
    type: 'folder'
  },
  {
    id: '2',
    title: 'Thùng Heineken Silver 24 lon cao',
    sender: 'HEINEKEN VIETNAM',
    sku: 'SKU-KEN-SILVER-24',
    code: 'LSX-2023-11-008',
    date: '21/11/2023',
    status: 'completed',
    notificationCount: 5,
    isMyTask: true,
    type: 'folder'
  },
  {
    id: '3',
    title: 'Thùng OMO Matic 3kg',
    sender: 'UNILEVER',
    sku: 'SKU-OMO-3KG',
    code: 'LSX-2023-11-020',
    date: '22/11/2023',
    status: 'completed',
    notificationCount: 0,
    isMyTask: false,
    type: 'folder'
  },
  {
    id: '4',
    title: 'Thùng Larue Biere Xuất Khẩu',
    sender: 'HEINEKEN VIETNAM',
    sku: 'SKU-LARUE-EX-12',
    code: 'LSX-2023-11-005',
    date: '18/11/2023',
    status: 'completed',
    notificationCount: 0,
    isMyTask: false,
    type: 'folder'
  },
  {
    id: '5',
    title: 'Thùng Pepsi Cola 330ml x 24',
    sender: 'PEPSICO',
    sku: 'SKU-PEP-STD-24',
    code: 'LSX-2023-11-012',
    date: '15/11/2023',
    status: 'completed',
    notificationCount: 0,
    isMyTask: false,
    type: 'folder'
  },
   {
    id: '6',
    title: 'Hộp quà Tết 7UP - Lốc 6',
    sender: 'PEPSICO',
    sku: 'SKU-7UP-TET-06',
    code: 'LSX-2023-10-099',
    date: '25/10/2023',
    status: 'completed',
    notificationCount: 0,
    isMyTask: false,
    type: 'folder'
  }
];

export const MOCK_MOBILE_CHAT: ChatMessage[] = [
  { id: '1', sender: 'Client - Anh Nam', role: 'Client', avatar: 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=100&h=100&fit=crop', text: 'Em kiểm tra lại mã màu Pantone xanh Tiger nhé, hơi đậm.', timestamp: '09:00 AM', isMe: false },
  { id: '2', sender: 'Bạn', role: 'Bạn', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', text: 'Dạ em đang cho test lại bản in mẫu.', timestamp: '09:15 AM', isMe: true },
  { id: '3', sender: 'Quản lý', role: 'Quản lý', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', text: '@NV001 Chú ý kiểm tra kỹ phần chồng màu nhé.', timestamp: '09:30 AM', isMe: false },
];

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    title: 'Thùng Tiger Crystal 24 lon 330ml',
    abstract: 'Thùng carton 3 lớp, in offset chất lượng cao, cán màng bóng.',
    code: 'SKU-TIGER-CRYSTAL-24',
    productionOrder: 'PO-2023-11-005',
    date: '20/11/2023',
    sender: 'HEINEKEN VIETNAM',
    status: 'processing',
    urgency: 'urgent',
    type: 'incoming',
    attachmentName: 'TK_Tiger_Crystal_v12.pdf',
    department: 'Phòng Thiết Kế',
    handler: 'Nguyễn Thành Nam',
    specs: {
      dimensions: '300 x 220 x 180 mm',
      material: 'Giấy Duplex 250 + Sóng E',
      flute: 'Sóng E',
      printTech: 'In Offset 4 màu + 1 nhũ',
      colors: ['Xanh Tiger', 'Bạc', 'Trắng'],
      netWeight: '320g'
    },
    defects: [
      { 
        id: '1', date: '01/01/2026', productionOrder: 'PO-2023-11-005', 
        song: 'Hở Nắp', songImages: ['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=50&h=50&fit=crop'], 
        in: '', inImages: [], 
        thanhPham: '', thanhPhamImages: [], 
        kho: '', khoImages: [], 
        solution: 'Dán lại keo' 
      },
      { 
        id: '2', date: '02/01/2026', productionOrder: 'PO-2023-11-005', 
        song: '', songImages: [], 
        in: 'Màu nhạt', inImages: [], 
        thanhPham: '', thanhPhamImages: [], 
        kho: '', khoImages: [], 
        solution: 'Tăng lượng mực' 
      },
      { 
        id: '3', date: '03/01/2026', productionOrder: 'PO-2023-11-005', 
        song: '', songImages: [], 
        in: '', inImages: [], 
        thanhPham: 'Bế lỗi', thanhPhamImages: [], 
        kho: '', khoImages: [], 
        solution: 'Chỉnh khuôn bế' 
      },
    ],
    specLogs: [
       {
           id: 's1', date: '01/01/2026', productionOrder: 'PO-2023-11-005', 
           content: 'Kiểm tra kích thước sau bế: 300x220mm (+/- 1mm)',
           result: 'Đạt'
       }
    ],
    approvalItems: []
  },
  {
    id: '2',
    title: 'Thùng Heineken Silver 24 lon cao',
    abstract: 'Thùng tiêu chuẩn xuất khẩu, chống thấm, chịu lực cao.',
    code: 'SKU-KEN-SILVER-24',
    productionOrder: 'PO-2023-12-010',
    date: '21/11/2023',
    sender: 'HEINEKEN VIETNAM',
    status: 'approved',
    urgency: 'normal',
    type: 'outgoing',
    department: 'Phòng Kỹ Thuật',
    handler: 'Trần Thị B',
    specs: {
      dimensions: '310 x 230 x 190 mm',
      material: 'Giấy Kraft nâu, 5 lớp',
      flute: 'Sóng BC',
      printTech: 'Flexo 3 màu',
      colors: ['Xanh Heineken', 'Đỏ'],
      netWeight: '450g'
    },
    defects: [],
    specLogs: []
  },
  {
    id: '3',
    title: 'Thùng Larue Biere Xuất Khẩu',
    abstract: 'Mẫu thiết kế mới cho dịp Tết 2024, hình ảnh con rồng.',
    code: 'SKU-LARUE-EX-12',
    productionOrder: 'PO-2023-11-099',
    date: '18/11/2023',
    sender: 'HEINEKEN VIETNAM',
    status: 'pending',
    urgency: 'normal',
    type: 'internal',
    department: 'Ban Giám Đốc',
    handler: 'Lê Văn C',
    specs: {
      dimensions: '280 x 200 x 150 mm',
      material: '3 lớp sóng B',
      flute: 'Sóng B',
      printTech: 'Offset',
      colors: ['Vàng', 'Xanh Dương'],
      netWeight: '280g'
    },
    defects: [],
    specLogs: []
  },
  {
    id: '4',
    title: 'Thùng Pepsi Cola 330ml x 24',
    abstract: 'Thùng tiêu chuẩn kênh quán ăn, nhà hàng.',
    code: 'SKU-PEP-STD-24',
    productionOrder: 'PO-2023-10-001',
    date: '15/11/2023',
    sender: 'PEPSICO',
    status: 'processing',
    urgency: 'urgent',
    type: 'incoming',
    department: 'Phòng Sales',
    handler: 'Phạm Thị D',
    specs: {
      dimensions: '300 x 200 x 120 mm',
      material: '5 lớp mộc',
      flute: 'Sóng B',
      printTech: 'Flexo 2 màu',
      colors: ['Xanh Pepsi', 'Đen'],
      netWeight: '400g'
    },
    specLogs: []
  },
  {
    id: '5',
    title: 'Hộp quà Tết 7UP - Lốc 6',
    abstract: 'Hộp quà biếu tặng, quai xách nhựa, cửa sổ bóng kính.',
    code: 'SKU-7UP-TET-06',
    productionOrder: 'PO-2023-10-015',
    date: '25/10/2023',
    sender: 'PEPSICO',
    status: 'approved',
    urgency: 'normal',
    type: 'incoming',
    department: 'Phòng Thiết Kế',
    handler: 'Hoàng Văn E',
    specs: {
      dimensions: '150 x 100 x 200 mm',
      material: 'Ivory 300',
      flute: 'N/A',
      printTech: 'Offset UV',
      colors: ['Xanh lá', 'Vàng chanh'],
      netWeight: '120g'
    },
    specLogs: []
  }
];

export const CHART_LINE_DATA: ChartDataPoint[] = [
  { name: '1', value: 40, value2: 60, value3: 20 },
  { name: '2', value: 30, value2: 65, value3: 25 },
  { name: '3', value: 20, value2: 68, value3: 15 },
  { name: '4', value: 27, value2: 70, value3: 18 },
  { name: '5', value: 18, value2: 75, value3: 30 },
  { name: '6', value: 23, value2: 80, value3: 40 },
  { name: '7', value: 34, value2: 78, value3: 45 },
  { name: '8', value: 45, value2: 82, value3: 50 },
  { name: '9', value: 30, value2: 85, value3: 48 },
  { name: '10', value: 25, value2: 88, value3: 42 },
];

export const CHART_BAR_DATA: ChartDataPoint[] = [
  { name: 'HEINEKEN', value: 100 },
  { name: 'PEPSICO', value: 85 },
  { name: 'COCA-COLA', value: 70 },
  { name: 'NESTLE', value: 60 },
  { name: 'UNILEVER', value: 50 },
];

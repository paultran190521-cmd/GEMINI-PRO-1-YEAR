import { CounselingSession, TeachingSession } from './types';

export const initialCounselingData: CounselingSession[] = [
  { id: 'c1', date: '2025-08-05', format: 'Trực tiếp', type: 'MELIS', client: 'QUỲNH NGÂN', duration: 60 },
  { id: 'c2', date: '2025-08-19', format: 'Trực tiếp', type: 'MELIS', client: 'QUỲNH NGÂN', duration: 60 },
  { id: 'c3', date: '2025-08-07', format: 'Trực tiếp', type: 'MELIS', client: 'QUỲNH TRÂM', duration: 60 },
  { id: 'c4', date: '2025-08-28', format: 'Online', type: 'Tham vấn', client: 'TÔ PHƯƠNG DUY', duration: 205 },
  { id: 'c5', date: '2025-08-08', format: 'Tổng đài', type: 'Tham vấn', client: 'NHI', duration: 91 },
  { id: 'c6', date: '2025-09-04', format: 'Online', type: 'Tham vấn', client: 'TÔ PHƯƠNG DUY', startTime: '14:05', endTime: '15:35', duration: 90, notes: 'noted' },
  { id: 'c7', date: '2025-09-11', format: 'Trực tiếp', type: 'Tham vấn', client: 'PHAN VÕ TRƯỜNG THỊNH', startTime: '15:05', endTime: '16:20', duration: 75 },
  { id: 'c8', date: '2025-10-03', format: 'Trực tiếp', type: 'Học đường', client: 'Nguyễn Ngọc Thạch', startTime: '16:30', endTime: '17:45', duration: 75, notes: 'NOTED' },
  { id: 'c9', date: '2025-11-08', format: 'Online', type: 'MELIS', client: 'QUỲNH TRÂM', startTime: '09:40', endTime: '10:40', duration: 60, notes: 'NOTE' },
  { id: 'c10', date: '2026-01-02', format: 'TÌNH HUỐNG HBS', type: 'HELLOBACSI', client: 'Ai đó làm ơn hãy chỉ cho em cách chết', duration: 0, postCount: 1 },
  { id: 'c11', date: '2026-01-02', format: 'TÌNH HUỐNG HBS', type: 'HELLOBACSI', client: 'Mình ám ảnh vì quá xấu', duration: 0, postCount: 1 },
  { id: 'c12', date: '2026-01-16', format: 'Trực tiếp', type: 'Tham vấn', client: 'ĐOÀN BÁ TÙNG', startTime: '13:20', endTime: '14:50', duration: 90, notes: 'R' },
  { id: 'c13', date: '2026-01-20', format: 'TÌNH HUỐNG HBS', type: 'HELLOBACSI', client: 'Sức khoẻ tinh thần và ảnh hưởng', duration: 0, postCount: 1 },
  { id: 'c14', date: '2026-02-07', format: 'Online', type: 'Tham vấn', client: 'LAN CHI', startTime: '10:00', endTime: '10:45', duration: 45 },
  { id: 'c15', date: '2026-03-10', format: 'Tổng đài', type: 'Tham vấn', client: 'SƠN TÂY', startTime: '08:22', endTime: '10:06', duration: 104 },
  { id: 'c16', date: '2026-04-06', format: 'Online', type: 'Học đường', client: 'Lương Hà Mi', startTime: '14:00', endTime: '14:50', duration: 50 },
  { id: 'c17', date: '2026-04-07', format: 'Trực tiếp', type: 'Tham vấn', client: 'NGUYỄN NHẬT LINH', startTime: '14:50', endTime: '16:50', duration: 120 },
];

export const initialTeachingData: TeachingSession[] = [
  { id: 't1', date: '2026-01-05', school: 'THPT TÂN TÚC', className: '11B12', periods: 1, unitPrice: 170000, totalPrice: 170000, notes: 'XONG' },
  { id: 't2', date: '2026-01-05', school: 'THPT TÂN TÚC', className: '11B9', periods: 1, unitPrice: 170000, totalPrice: 170000, notes: 'XONG' },
  { id: 't3', date: '2026-04-09', school: 'THPT NGUYỄN THỊ MINH KHAI', className: '10A3', periods: 2, unitPrice: 170000, totalPrice: 340000 },
];

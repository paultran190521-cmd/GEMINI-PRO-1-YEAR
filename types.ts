export interface CounselingSession {
  id: string;
  date: string; // YYYY-MM-DD
  format: string;
  type: string;
  client: string;
  startTime?: string;
  endTime?: string;
  duration: number; // in minutes
  postCount?: number; // Số bài (cho Hellobacsi)
  notes?: string;
  [key: string]: any; // Allow dynamic custom fields
}

export interface TeachingSession {
  id: string;
  date: string; // YYYY-MM-DD
  school: string;
  className: string;
  periods: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  [key: string]: any; // Allow dynamic custom fields
}

export interface KpiRecord {
  id: string;
  month: string;
  year: string;
  targetHours: number;
  leaveDays?: number;
  leaveType?: string;
  notes?: string;
  [key: string]: any;
}

export interface LeaveRecord {
  id: string;
  date: string; // YYYY-MM-DD
  month: string;
  year: string;
  days: number;
  type: string;
  reason?: string;
  [key: string]: any;
}

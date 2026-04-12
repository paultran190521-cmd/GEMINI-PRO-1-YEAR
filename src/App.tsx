import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Dashboard from './components/Dashboard';
import CounselingManager from './components/CounselingManager';
import TeachingManager from './components/TeachingManager';
import KpiManager from './components/KpiManager';
import LeaveManager from './components/LeaveManager';
import { LayoutDashboard, Users, BookOpen, Loader2, Target, CalendarOff } from 'lucide-react';
import { CounselingSession, TeachingSession, KpiRecord, LeaveRecord } from './types';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzR5e4WNa4LtK3RVZv_5gFRh_bWvp-O_3ghiBMqUm-sX4u8Wi-mODP1Rt2irULJOSpTaw/exec";

// Helper to normalize various date formats (e.g., DD/MM/YYYY, MM/DD/YYYY, ISO) to YYYY-MM-DD
const normalizeDate = (rawDate: any): string => {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  
  try {
    // If it's already a string in YYYY-MM-DD format
    if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.substring(0, 10))) {
      return rawDate.substring(0, 10);
    }

    let d = new Date(rawDate);
    
    // If invalid date, try parsing DD/MM/YYYY
    if (isNaN(d.getTime()) && typeof rawDate === 'string') {
      const parts = rawDate.split(/[-/]/);
      if (parts.length === 3) {
        // Assume DD/MM/YYYY
        d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }

    if (!isNaN(d.getTime())) {
      // Use local timezone to avoid shifting days
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return String(rawDate);
  } catch (e) {
    return String(rawDate);
  }
};

// Helper to normalize time from Google Sheets (which might be an ISO date string) to HH:mm
const normalizeTime = (rawTime: any): string => {
  if (!rawTime) return '';
  if (typeof rawTime === 'string') {
    if (rawTime.includes('T')) {
      const d = new Date(rawTime);
      if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    // Extract HH:mm if it's a longer string
    const match = rawTime.match(/(\d{1,2}:\d{2})/);
    if (match) return match[1];
  }
  return String(rawTime);
};

export default function App() {
  const [counselingData, setCounselingData] = useState<CounselingSession[]>([]);
  const [teachingData, setTeachingData] = useState<TeachingSession[]>([]);
  const [kpiData, setKpiData] = useState<KpiRecord[]>([]);
  const [leaveData, setLeaveData] = useState<LeaveRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [resCounseling, resTeaching, resKpi, resLeave] = await Promise.all([
          fetch(`${SCRIPT_URL}?sheet=ThamVan`),
          fetch(`${SCRIPT_URL}?sheet=KyNangSong`),
          fetch(`${SCRIPT_URL}?sheet=KPI`),
          fetch(`${SCRIPT_URL}?sheet=NghiPhep`)
        ]);
        
        const dataCounseling = await resCounseling.json();
        const dataTeaching = await resTeaching.json();
        const dataKpi = await resKpi.json();
        const dataLeave = await resLeave.json();

        // Safely handle potential errors from Apps Script (e.g., sheet not found)
        const safeDataCounseling = Array.isArray(dataCounseling) ? dataCounseling : [];
        const safeDataTeaching = Array.isArray(dataTeaching) ? dataTeaching : [];
        const safeDataKpi = Array.isArray(dataKpi) ? dataKpi : [];
        const safeDataLeave = Array.isArray(dataLeave) ? dataLeave : [];

        // Format data (ensure numbers are numbers and dates are normalized)
        const formattedCounseling = safeDataCounseling
          .filter((d: any) => d.id)
          .map((d: any) => ({
            ...d,
            date: normalizeDate(d.date),
            startTime: normalizeTime(d.startTime),
            endTime: normalizeTime(d.endTime),
            duration: Math.round(Number(d.duration)) || 0,
            postCount: Number(d.postCount) || 0
          }));

        const formattedTeaching = safeDataTeaching
          .filter((d: any) => d.id)
          .map((d: any) => ({
            ...d,
            date: normalizeDate(d.date),
            periods: Number(d.periods) || 0,
            unitPrice: Number(d.unitPrice) || 0,
            totalPrice: Number(d.totalPrice) || 0
          }));
          
        const formattedKpi = safeDataKpi
          .filter((d: any) => d.id)
          .map((d: any) => ({
            ...d,
            targetHours: Number(d.targetHours) || 0,
            leaveDays: Number(d.leaveDays) || 0,
            leaveType: d.leaveType || ''
          }));

        const formattedLeave = safeDataLeave
          .filter((d: any) => d.id)
          .map((d: any) => ({
            ...d,
            days: Number(d.days) || 0
          }));

        // Reverse to show newest first (assuming new items are appended to bottom of sheet)
        setCounselingData(formattedCounseling.reverse()); 
        setTeachingData(formattedTeaching.reverse());
        setKpiData(formattedKpi.reverse());
        setLeaveData(formattedLeave.reverse());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const apiCall = async (sheet: string, action: string, data: any) => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          // Using text/plain avoids CORS preflight issues with Google Apps Script
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          sheet: sheet,
          action: action,
          data: data
        }),
      });
    } catch (error) {
      console.error(`Error ${action} on ${sheet}:`, error);
    }
  };

  // Counseling Handlers
  const handleAddCounseling = (newSession: CounselingSession) => {
    setCounselingData(prev => [newSession, ...prev]);
    apiCall('ThamVan', 'add', newSession);
  };
  
  const handleEditCounseling = (updated: CounselingSession) => {
    setCounselingData(prev => prev.map(item => item.id === updated.id ? updated : item));
    apiCall('ThamVan', 'edit', updated);
  };
  
  const handleDeleteCounseling = (id: string) => {
    setCounselingData(prev => prev.filter(item => item.id !== id));
    apiCall('ThamVan', 'delete', { id });
  };

  // Teaching Handlers
  const handleAddTeaching = (newSession: TeachingSession) => {
    setTeachingData(prev => [newSession, ...prev]);
    apiCall('KyNangSong', 'add', newSession);
  };
  
  const handleEditTeaching = (updated: TeachingSession) => {
    setTeachingData(prev => prev.map(item => item.id === updated.id ? updated : item));
    apiCall('KyNangSong', 'edit', updated);
  };
  
  const handleDeleteTeaching = (id: string) => {
    setTeachingData(prev => prev.filter(item => item.id !== id));
    apiCall('KyNangSong', 'delete', { id });
  };

  // KPI Handlers
  const handleAddKpi = (newRecord: KpiRecord) => {
    setKpiData(prev => [newRecord, ...prev]);
    apiCall('KPI', 'add', newRecord);
  };
  
  const handleEditKpi = (updated: KpiRecord) => {
    setKpiData(prev => prev.map(item => item.id === updated.id ? updated : item));
    apiCall('KPI', 'edit', updated);
  };
  
  const handleDeleteKpi = (id: string) => {
    setKpiData(prev => prev.filter(item => item.id !== id));
    apiCall('KPI', 'delete', { id });
  };

  // Leave Handlers
  const handleAddLeave = (newRecord: LeaveRecord) => {
    setLeaveData(prev => [newRecord, ...prev]);
    apiCall('NghiPhep', 'add', newRecord);
  };

  const handleEditLeave = (updated: LeaveRecord) => {
    setLeaveData(prev => prev.map(item => item.id === updated.id ? updated : item));
    apiCall('NghiPhep', 'edit', updated);
  };

  const handleDeleteLeave = (id: string) => {
    setLeaveData(prev => prev.filter(item => item.id !== id));
    apiCall('NghiPhep', 'delete', { id });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50/50 via-white to-orange-50/30 text-[#0f3742] font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-cyan-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-2.5 rounded-xl shadow-md">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Tran Thien PSY
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-[#0f3742]/70 font-bold animate-pulse">Đang tải dữ liệu từ Google Sheets...</p>
          </div>
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-5 shadow-md p-1 bg-white/80 backdrop-blur-sm rounded-xl border border-cyan-100">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Tổng quan</span>
              </TabsTrigger>
              <TabsTrigger value="counseling" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Tham vấn</span>
              </TabsTrigger>
              <TabsTrigger value="teaching" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Dạy KNS</span>
              </TabsTrigger>
              <TabsTrigger value="kpi" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-accent/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Lưu trữ Giờ</span>
              </TabsTrigger>
              <TabsTrigger value="leave" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-orange-400/10 data-[state=active]:text-orange-600 data-[state=active]:shadow-none">
                <CalendarOff className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Ngày nghỉ</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Dashboard counselingData={counselingData} teachingData={teachingData} kpiData={kpiData} />
            </TabsContent>

            <TabsContent value="counseling" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CounselingManager 
                data={counselingData} 
                onAdd={handleAddCounseling} 
                onEdit={handleEditCounseling}
                onDelete={handleDeleteCounseling}
              />
            </TabsContent>

            <TabsContent value="teaching" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TeachingManager 
                data={teachingData} 
                onAdd={handleAddTeaching}
                onEdit={handleEditTeaching}
                onDelete={handleDeleteTeaching}
              />
            </TabsContent>
            
            <TabsContent value="kpi" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <KpiManager 
                data={kpiData} 
                counselingData={counselingData}
                teachingData={teachingData}
                onAdd={handleAddKpi}
                onEdit={handleEditKpi}
                onDelete={handleDeleteKpi}
              />
            </TabsContent>

            <TabsContent value="leave" className="focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <LeaveManager 
                data={leaveData} 
                onAdd={handleAddLeave}
                onEdit={handleEditLeave}
                onDelete={handleDeleteLeave}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

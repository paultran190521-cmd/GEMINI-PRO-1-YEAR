import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Clock, Users, BookOpen, DollarSign, Download, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CounselingSession, TeachingSession, KpiRecord } from '../types';
import * as htmlToImage from 'html-to-image';

interface DashboardProps {
  counselingData: CounselingSession[];
  teachingData: TeachingSession[];
  kpiData?: KpiRecord[];
}

export default function Dashboard({ counselingData, teachingData, kpiData = [] }: DashboardProps) {
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const reportRef = useRef<HTMLDivElement>(null);

  // Extract unique years
  const years = useMemo(() => {
    const y1 = counselingData.map(d => new Date(d.date).getFullYear().toString());
    const y2 = teachingData.map(d => new Date(d.date).getFullYear().toString());
    return Array.from(new Set([...y1, ...y2])).sort();
  }, [counselingData, teachingData]);

  // Filter data for summary cards
  const filteredCounseling = useMemo(() => {
    return counselingData.filter(item => {
      const date = new Date(item.date);
      const month = (date.getMonth() + 1).toString();
      const year = date.getFullYear().toString();
      if (filterMonth !== 'all' && month !== filterMonth) return false;
      if (filterYear !== 'all' && year !== filterYear) return false;
      return true;
    });
  }, [counselingData, filterMonth, filterYear]);

  const filteredTeaching = useMemo(() => {
    return teachingData.filter(item => {
      const date = new Date(item.date);
      const month = (date.getMonth() + 1).toString();
      const year = date.getFullYear().toString();
      if (filterMonth !== 'all' && month !== filterMonth) return false;
      if (filterYear !== 'all' && year !== filterYear) return false;
      return true;
    });
  }, [teachingData, filterMonth, filterYear]);

  const totalCounselingMinutes = filteredCounseling.reduce((sum, item) => sum + item.duration, 0);
  const totalCounselingHours = (totalCounselingMinutes / 60).toFixed(1);
  const totalCounselingSessions = filteredCounseling.length;
  
  const totalTeachingPeriods = filteredTeaching.reduce((sum, item) => sum + item.periods, 0);
  const totalIncome = filteredTeaching.reduce((sum, item) => sum + item.totalPrice, 0);

  // KPI Calculation for current filtered month/year
  const currentKpi = useMemo(() => {
    if (filterMonth === 'all') return null; // KPI is monthly
    return kpiData.find(k => k.month === filterMonth && k.year === filterYear) || null;
  }, [kpiData, filterMonth, filterYear]);

  const kpiStats = useMemo(() => {
    const counselingMinutes = filteredCounseling.reduce((sum, item) => sum + item.duration, 0);
    const counselingHours = counselingMinutes / 60;
    const teachingPeriods = filteredTeaching.reduce((sum, item) => sum + item.periods, 0);
    const teachingHours = (teachingPeriods * 45) / 60;
    return {
      counselingHours,
      teachingPeriods,
      teachingHours,
      totalHours: counselingHours + teachingHours
    };
  }, [filteredCounseling, filteredTeaching]);

  // Group data by month for chart (filter by year only to show trend)
  const monthlyData = useMemo(() => {
    const dataMap: Record<string, { month: string; counselingHours: number; teachingIncome: number }> = {};

    const chartCounseling = filterYear === 'all' ? counselingData : counselingData.filter(d => new Date(d.date).getFullYear().toString() === filterYear);
    const chartTeaching = filterYear === 'all' ? teachingData : teachingData.filter(d => new Date(d.date).getFullYear().toString() === filterYear);

    chartCounseling.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!dataMap[monthKey]) {
        dataMap[monthKey] = { month: monthKey, counselingHours: 0, teachingIncome: 0 };
      }
      dataMap[monthKey].counselingHours += item.duration / 60;
    });

    chartTeaching.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!dataMap[monthKey]) {
        dataMap[monthKey] = { month: monthKey, counselingHours: 0, teachingIncome: 0 };
      }
      dataMap[monthKey].teachingIncome += item.totalPrice;
    });

    return Object.values(dataMap).sort((a, b) => a.month.localeCompare(b.month));
  }, [counselingData, teachingData, filterYear]);

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        quality: 1,
        backgroundColor: '#f8fafc',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Bao_Cao_Thong_Ke_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  const showCounseling = filterCategory === 'all' || filterCategory === 'counseling';
  const showTeaching = filterCategory === 'all' || filterCategory === 'teaching';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Card className="shadow-sm border-t-4 border-t-primary bg-gradient-to-br from-white to-cyan-50/50 flex-1 w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-[#0f3742]">Bộ lọc báo cáo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0f3742]/70">Mảng</label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="counseling">Tham vấn</SelectItem>
                    <SelectItem value="teaching">Dạy Kỹ năng sống</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0f3742]/70">Năm</label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả các năm</SelectItem>
                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0f3742]/70">Tháng</label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả các tháng</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Button onClick={handleExportImage} className="bg-primary hover:bg-primary/90 text-white shadow-md font-bold h-12 px-6">
          <Download className="mr-2 h-5 w-5" /> Xuất báo cáo (Ảnh)
        </Button>
      </div>

      {/* Exportable Area */}
      <div ref={reportRef} className="space-y-6 p-4 -m-4 bg-[#f8fafc] rounded-xl">
        {/* Monthly Summary Section */}
        {filterMonth !== 'all' && (
          <Card className="shadow-sm border-cyan-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-extrabold text-[#0f3742] flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Thống kê Giờ làm việc (Tháng {filterMonth}/{filterYear})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-semibold text-[#0f3742]/60">Tổng giờ đã thực hiện (Tham vấn + Dạy KNS)</p>
                    <p className="text-3xl font-black text-[#0f3742]">
                      {kpiStats.totalHours.toFixed(1)} <span className="text-lg font-bold text-[#0f3742]/50">giờ</span>
                    </p>
                  </div>
                  {currentKpi && currentKpi.targetHours > 0 && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#0f3742]/60">Giờ đã lưu (từ tab Lưu trữ)</p>
                      <p className="text-xl font-bold text-primary">
                        {currentKpi.targetHours} <span className="text-sm font-bold text-[#0f3742]/50">giờ</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-cyan-50 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm font-bold text-[#0f3742]/70">Tham vấn: {kpiStats.counselingHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                    <span className="text-sm font-bold text-[#0f3742]/70">Dạy KNS: {kpiStats.teachingHours.toFixed(1)}h ({kpiStats.teachingPeriods} tiết)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {showCounseling && (
            <>
              <Card className="shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-cyan-50/80 border-cyan-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-[#0f3742]/70">Tổng giờ tham vấn</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-full shadow-inner">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-[#0f3742]">{totalCounselingHours} <span className="text-lg font-bold text-[#0f3742]/70">giờ</span></div>
                  <p className="text-sm text-[#0f3742]/60 mt-1 font-semibold">
                    {totalCounselingMinutes} phút
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50/80 border-orange-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-[#0f3742]/70">Tổng ca tham vấn</CardTitle>
                  <div className="p-2 bg-accent/10 rounded-full shadow-inner">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-[#0f3742]">{totalCounselingSessions} <span className="text-lg font-bold text-[#0f3742]/70">ca</span></div>
                  <p className="text-sm text-[#0f3742]/60 mt-1 font-semibold">
                    Đã hoàn thành
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {showTeaching && (
            <>
              <Card className="shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-cyan-50/80 border-cyan-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-[#0f3742]/70">Tổng tiết dạy KNS</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-full shadow-inner">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-[#0f3742]">{totalTeachingPeriods} <span className="text-lg font-bold text-[#0f3742]/70">tiết</span></div>
                </CardContent>
              </Card>
              <Card className="shadow-md hover:shadow-lg transition-all hover:-translate-y-1 bg-gradient-to-br from-white to-orange-50/80 border-orange-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-[#0f3742]/70">Tổng thu nhập KNS</CardTitle>
                  <div className="p-2 bg-accent/10 rounded-full shadow-inner">
                    <DollarSign className="h-4 w-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold text-[#0f3742]">{totalIncome.toLocaleString('vi-VN')} <span className="text-lg font-bold text-[#0f3742]/70">đ</span></div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className={`grid gap-6 ${showCounseling && showTeaching ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {showCounseling && (
            <Card className="shadow-md bg-white border-cyan-100">
              <CardHeader>
                <CardTitle className="text-[#0f3742]">Biểu đồ giờ tham vấn theo tháng</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#0f3742', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#0f3742', fontWeight: 600 }} dx={-10} />
                      <Tooltip 
                        formatter={(value: number) => [value.toFixed(1) + ' giờ', 'Giờ tham vấn']}
                        cursor={{ fill: '#f0f9ff' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #bae6fd', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f3742', fontWeight: 700 }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600, color: '#0f3742' }} />
                      <Bar dataKey="counselingHours" name="Giờ tham vấn" fill="#1992b0" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {showTeaching && (
            <Card className="shadow-md bg-white border-orange-100">
              <CardHeader>
                <CardTitle className="text-[#0f3742]">Biểu đồ thu nhập KNS theo tháng</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#0f3742', fontWeight: 600 }} dy={10} />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#0f3742', fontWeight: 600 }} 
                        dx={-10}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [value.toLocaleString('vi-VN') + ' đ', 'Thu nhập KNS']}
                        cursor={{ fill: '#fff7ed' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #ffedd5', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f3742', fontWeight: 700 }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600, color: '#0f3742' }} />
                      <Bar dataKey="teachingIncome" name="Thu nhập KNS" fill="#ff9500" radius={[6, 6, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

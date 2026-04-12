import React, { useState, useMemo } from 'react';
import { KpiRecord, CounselingSession, TeachingSession } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Target, Clock, BookOpen, TrendingUp } from 'lucide-react';

interface KpiManagerProps {
  data: KpiRecord[];
  counselingData: CounselingSession[];
  teachingData: TeachingSession[];
  onAdd: (record: KpiRecord) => void;
  onEdit: (record: KpiRecord) => void;
  onDelete: (id: string) => void;
}

export default function KpiManager({ data, counselingData, teachingData, onAdd, onEdit, onDelete }: KpiManagerProps) {
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<KpiRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newRecord, setNewRecord] = useState<Partial<KpiRecord>>({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    targetHours: 0,
    notes: ''
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.month || !newRecord.year) return;

    // Check if KPI for this month/year already exists
    const exists = data.find(d => d.month === newRecord.month && d.year === newRecord.year);
    if (exists) {
      alert('KPI cho tháng này đã tồn tại! Vui lòng sửa bản ghi hiện có.');
      return;
    }

    onAdd({
      ...newRecord,
      id: `kpi${Date.now()}`,
    } as KpiRecord);
    
    setIsAddDialogOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      onEdit(editingRecord);
      setEditingRecord(null);
    }
  };

  const years = useMemo(() => {
    const y = new Set([new Date().getFullYear().toString(), ...data.map(d => d.year)]);
    return Array.from(y).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterYear !== 'all' && item.year !== filterYear) return false;
      return true;
    }).sort((a, b) => parseInt(b.month) - parseInt(a.month)); // Sort by month descending
  }, [data, filterYear]);

  // Calculate stats for a specific month/year
  const getStats = (month: string, year: string) => {
    const cData = counselingData.filter(d => {
      const date = new Date(d.date);
      return (date.getMonth() + 1).toString() === month && date.getFullYear().toString() === year;
    });
    
    const tData = teachingData.filter(d => {
      const date = new Date(d.date);
      return (date.getMonth() + 1).toString() === month && date.getFullYear().toString() === year;
    });

    const counselingMinutes = cData.reduce((sum, item) => sum + item.duration, 0);
    const counselingHours = counselingMinutes / 60;
    
    const teachingPeriods = tData.reduce((sum, item) => sum + item.periods, 0);
    const teachingHours = (teachingPeriods * 45) / 60; // Assuming 1 period = 45 mins

    const totalHours = counselingHours + teachingHours;

    return { counselingHours, teachingPeriods, teachingHours, totalHours };
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm bg-gradient-to-br from-white to-cyan-50/50 border-cyan-100">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-[#0f3742] flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Lưu trữ Giờ làm việc
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white shadow-md font-bold" />}>
              <Plus className="mr-2 h-4 w-4" /> Nhập số giờ
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-white text-[#0f3742]">
              <DialogHeader>
                <DialogTitle className="text-[#0f3742]">Nhập số giờ làm việc</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Tháng</label>
                    <Select value={newRecord.month} onValueChange={v => setNewRecord({...newRecord, month: v})}>
                      <SelectTrigger className="border-cyan-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Năm</label>
                    <Select value={newRecord.year} onValueChange={v => setNewRecord({...newRecord, year: v})}>
                      <SelectTrigger className="border-cyan-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        <SelectItem value={(new Date().getFullYear() + 1).toString()}>{(new Date().getFullYear() + 1).toString()}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Số giờ đã làm</label>
                  <Input type="number" min="0" step="0.5" required value={newRecord.targetHours} onChange={e => setNewRecord({...newRecord, targetHours: parseFloat(e.target.value) || 0})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Ghi chú</label>
                  <Input value={newRecord.notes} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} className="border-cyan-200" />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold">Lưu dữ liệu</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="w-48 space-y-2">
            <label className="text-sm font-bold text-[#0f3742]/70">Lọc theo Năm</label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredData.length === 0 ? (
          <div className="col-span-full text-center py-12 text-[#0f3742]/60 font-medium bg-white rounded-xl border border-cyan-100 border-dashed">
            Chưa có dữ liệu giờ làm việc cho năm này.
          </div>
        ) : (
          filteredData.map(item => {
            const stats = getStats(item.month, item.year);

            return (
              <Card key={item.id} className="shadow-md border-cyan-100 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-extrabold text-[#0f3742]">
                      Tháng {item.month}/{item.year}
                    </CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => setEditingRecord(item)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-semibold text-[#0f3742]/60">Số giờ đã lưu</p>
                      <p className="text-3xl font-black text-[#0f3742]">
                        {item.targetHours} <span className="text-lg font-bold text-[#0f3742]/50">giờ</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cyan-50">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#0f3742]/60">
                        <Clock className="h-3 w-3" /> Tham vấn
                      </div>
                      <p className="text-sm font-bold text-primary">{stats.counselingHours.toFixed(1)} giờ</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-[#0f3742]/60">
                        <BookOpen className="h-3 w-3" /> Dạy KNS
                      </div>
                      <p className="text-sm font-bold text-accent">{stats.teachingPeriods} tiết <span className="text-xs font-normal">({stats.teachingHours.toFixed(1)}h)</span></p>
                    </div>
                  </div>
                  
                  {item.notes && (
                    <p className="text-xs text-[#0f3742]/60 italic mt-2">"{item.notes}"</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white text-[#0f3742]">
          <DialogHeader>
            <DialogTitle className="text-[#0f3742]">Sửa dữ liệu Tháng {editingRecord?.month}/{editingRecord?.year}</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Số giờ đã làm</label>
                <Input type="number" min="0" step="0.5" required value={editingRecord.targetHours} onChange={e => setEditingRecord({...editingRecord, targetHours: parseFloat(e.target.value) || 0})} className="border-cyan-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Ghi chú</label>
                <Input value={editingRecord.notes || ''} onChange={e => setEditingRecord({...editingRecord, notes: e.target.value})} className="border-cyan-200" />
              </div>
              <div className="flex justify-end pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingRecord(null)} className="font-bold">Hủy</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold">Cập nhật</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white text-[#0f3742]">
          <DialogHeader>
            <DialogTitle className="text-[#0f3742]">Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#0f3742]/80 font-medium">Bạn có chắc chắn muốn xóa bản ghi này không?</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingId(null)} className="font-bold">Hủy</Button>
            <Button variant="destructive" onClick={() => { if (deletingId) onDelete(deletingId); setDeletingId(null); }} className="font-bold">Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

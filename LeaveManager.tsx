import React, { useState, useMemo } from 'react';
import { LeaveRecord } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, CalendarOff, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LeaveManagerProps {
  data: LeaveRecord[];
  onAdd: (record: LeaveRecord) => void;
  onEdit: (record: LeaveRecord) => void;
  onDelete: (id: string) => void;
}

export default function LeaveManager({ data, onAdd, onEdit, onDelete }: LeaveManagerProps) {
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LeaveRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newRecord, setNewRecord] = useState<Partial<LeaveRecord>>({
    date: new Date().toISOString().split('T')[0],
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    days: 0,
    type: 'Thường',
    reason: ''
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.date || !newRecord.month || !newRecord.year || newRecord.days === undefined || newRecord.days <= 0) return;

    onAdd({
      ...newRecord,
      id: `leave${Date.now()}`,
    } as LeaveRecord);
    
    setIsAddDialogOpen(false);
    setNewRecord({
      ...newRecord,
      date: new Date().toISOString().split('T')[0],
      days: 0,
      reason: ''
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord && editingRecord.days !== undefined && editingRecord.days > 0) {
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
    }).sort((a, b) => {
      if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
      return parseInt(b.month) - parseInt(a.month);
    });
  }, [data, filterYear]);

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = (i + 1).toString();
      const monthData = filteredData.filter(d => d.month === monthStr);
      return {
        name: `T${monthStr}`,
        'Thường': monthData.filter(d => d.type === 'Thường').reduce((sum, d) => sum + d.days, 0),
        'Năm': monthData.filter(d => d.type === 'Năm').reduce((sum, d) => sum + d.days, 0),
        'Không lương': monthData.filter(d => d.type === 'Không lương').reduce((sum, d) => sum + d.days, 0),
        'Khác': monthData.filter(d => d.type === 'Khác').reduce((sum, d) => sum + d.days, 0),
      };
    });
  }, [filteredData]);

  const totalDays = filteredData.reduce((sum, item) => sum + item.days, 0);

  return (
    <div className="space-y-4">
      <Card className="shadow-sm bg-gradient-to-br from-white to-orange-50/50 border-orange-100">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-[#0f3742] flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-orange-500" />
            Quản lý Ngày nghỉ
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger render={<Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md font-bold" />}>
              <Plus className="mr-2 h-4 w-4" /> Thêm ngày nghỉ
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-white text-[#0f3742]">
              <DialogHeader>
                <DialogTitle className="text-[#0f3742]">Nhập thông tin nghỉ phép</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Ngày nghỉ</label>
                  <Input 
                    type="date" 
                    required 
                    value={newRecord.date} 
                    onChange={e => {
                      const d = new Date(e.target.value);
                      setNewRecord({
                        ...newRecord, 
                        date: e.target.value,
                        month: (d.getMonth() + 1).toString(),
                        year: d.getFullYear().toString()
                      });
                    }} 
                    className="border-orange-200" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Tháng</label>
                    <Select value={newRecord.month} onValueChange={v => setNewRecord({...newRecord, month: v})}>
                      <SelectTrigger className="border-orange-200"><SelectValue /></SelectTrigger>
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
                      <SelectTrigger className="border-orange-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        <SelectItem value={(new Date().getFullYear() + 1).toString()}>{(new Date().getFullYear() + 1).toString()}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Số ngày</label>
                    <Input type="number" min="0.5" step="0.5" required value={newRecord.days} onChange={e => setNewRecord({...newRecord, days: parseFloat(e.target.value) || 0})} className="border-orange-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Loại nghỉ</label>
                    <Select value={newRecord.type} onValueChange={v => setNewRecord({...newRecord, type: v})}>
                      <SelectTrigger className="border-orange-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Thường">Thường</SelectItem>
                        <SelectItem value="Năm">Năm</SelectItem>
                        <SelectItem value="Không lương">Không lương</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Lý do</label>
                  <Input required value={newRecord.reason} onChange={e => setNewRecord({...newRecord, reason: e.target.value})} className="border-orange-200" placeholder="Nhập lý do nghỉ..." />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 font-bold">Lưu dữ liệu</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="w-48 space-y-2">
            <label className="text-sm font-bold text-[#0f3742]/70">Lọc theo Năm</label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="shadow-sm bg-white border-orange-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Area */}
        <Card className="shadow-md border-orange-100 lg:col-span-2">
          <CardHeader className="pb-2 border-b border-orange-50 bg-orange-50/30">
            <CardTitle className="text-base font-extrabold text-[#0f3742] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              Biểu đồ ngày nghỉ năm {filterYear !== 'all' ? filterYear : 'Tất cả'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                  <Bar dataKey="Thường" stackId="a" fill="#1992b0" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Năm" stackId="a" fill="#ff9500" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Không lương" stackId="a" fill="#e23670" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Khác" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Summary & List Area */}
        <Card className="shadow-md border-orange-100">
          <CardHeader className="pb-2 border-b border-orange-50 bg-orange-50/30 flex flex-row justify-between items-center">
            <CardTitle className="text-base font-extrabold text-[#0f3742]">
              Danh sách chi tiết
            </CardTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-bold">
              Tổng: {totalDays} ngày
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-white sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="font-bold text-[#0f3742]">Thời gian</TableHead>
                    <TableHead className="font-bold text-[#0f3742]">Chi tiết</TableHead>
                    <TableHead className="text-right font-bold text-[#0f3742]">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-[#0f3742]/60 font-medium">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map(item => (
                      <TableRow key={item.id} className="hover:bg-orange-50/30">
                        <TableCell className="whitespace-nowrap">
                          <div className="font-bold text-[#0f3742]">{item.date ? new Date(item.date).toLocaleDateString('vi-VN') : `T${item.month}/${item.year}`}</div>
                          <Badge variant="outline" className={`mt-1 text-[10px] ${
                            item.type === 'Năm' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            item.type === 'Không lương' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-cyan-50 text-cyan-700 border-cyan-200'
                          }`}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-orange-600">{item.days} ngày</div>
                          <div className="text-xs text-[#0f3742]/70 mt-1 line-clamp-2" title={item.reason}>{item.reason}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary" onClick={() => setEditingRecord(item)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white text-[#0f3742]">
          <DialogHeader>
            <DialogTitle className="text-[#0f3742]">Sửa thông tin nghỉ phép</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">Ngày nghỉ</label>
                <Input 
                  type="date" 
                  required 
                  value={editingRecord.date || ''} 
                  onChange={e => {
                    const d = new Date(e.target.value);
                    setEditingRecord({
                      ...editingRecord, 
                      date: e.target.value,
                      month: (d.getMonth() + 1).toString(),
                      year: d.getFullYear().toString()
                    });
                  }} 
                  className="border-orange-200" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Tháng</label>
                  <Select value={editingRecord.month} onValueChange={v => setEditingRecord({...editingRecord, month: v})}>
                    <SelectTrigger className="border-orange-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Năm</label>
                  <Select value={editingRecord.year} onValueChange={v => setEditingRecord({...editingRecord, year: v})}>
                    <SelectTrigger className="border-orange-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      <SelectItem value={(new Date().getFullYear() + 1).toString()}>{(new Date().getFullYear() + 1).toString()}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Số ngày</label>
                  <Input type="number" min="0.5" step="0.5" required value={editingRecord.days} onChange={e => setEditingRecord({...editingRecord, days: parseFloat(e.target.value) || 0})} className="border-orange-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Loại nghỉ</label>
                  <Select value={editingRecord.type} onValueChange={v => setEditingRecord({...editingRecord, type: v})}>
                    <SelectTrigger className="border-orange-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Thường">Thường</SelectItem>
                      <SelectItem value="Năm">Năm</SelectItem>
                      <SelectItem value="Không lương">Không lương</SelectItem>
                      <SelectItem value="Khác">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Lý do</label>
                <Input required value={editingRecord.reason || ''} onChange={e => setEditingRecord({...editingRecord, reason: e.target.value})} className="border-orange-200" />
              </div>
              <div className="flex justify-end pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingRecord(null)} className="font-bold">Hủy</Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 font-bold">Cập nhật</Button>
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

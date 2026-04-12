import React, { useState, useMemo, useEffect } from 'react';
import { TeachingSession } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface TeachingManagerProps {
  data: TeachingSession[];
  onAdd: (session: TeachingSession) => void;
  onEdit: (session: TeachingSession) => void;
  onDelete: (id: string) => void;
}

const standardKeys = ['id', 'date', 'school', 'className', 'periods', 'unitPrice', 'totalPrice', 'notes'];

export default function TeachingManager({ data, onAdd, onEdit, onDelete }: TeachingManagerProps) {
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TeachingSession | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Custom School
  const [customSchool, setCustomSchool] = useState('');

  // Dynamic Fields
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [newFieldName, setNewFieldName] = useState('');

  const [newSession, setNewSession] = useState<Partial<TeachingSession>>({
    date: new Date().toISOString().split('T')[0],
    school: '',
    className: '',
    periods: 1,
    unitPrice: 0,
    totalPrice: 0,
    notes: ''
  });

  // Auto calculate total price for newSession
  useEffect(() => {
    if (newSession.periods !== undefined && newSession.unitPrice !== undefined) {
      setNewSession(prev => ({ ...prev, totalPrice: (prev.periods || 0) * (prev.unitPrice || 0) }));
    }
  }, [newSession.periods, newSession.unitPrice]);

  // Auto calculate total price for editingSession
  useEffect(() => {
    if (editingSession?.periods !== undefined && editingSession?.unitPrice !== undefined) {
      setEditingSession(prev => prev ? { ...prev, totalPrice: prev.periods * prev.unitPrice } : null);
    }
  }, [editingSession?.periods, editingSession?.unitPrice]);

  const handleAddDynamicField = () => {
    if (newFieldName && !dynamicFields[newFieldName]) {
      setDynamicFields(prev => ({ ...prev, [newFieldName]: '' }));
      setNewFieldName('');
    }
  };

  const removeDynamicField = (key: string) => {
    const newFields = { ...dynamicFields };
    delete newFields[key];
    setDynamicFields(newFields);
  };

  const openAddDialog = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (open) {
      setDynamicFields({});
      setCustomSchool('');
      setNewSession({
        date: new Date().toISOString().split('T')[0],
        school: '',
        className: '',
        periods: 1,
        unitPrice: 0,
        totalPrice: 0,
        notes: ''
      });
    }
  };

  const openEditDialog = (session: TeachingSession) => {
    setEditingSession(session);
    setCustomSchool('');
    
    // Extract dynamic fields from session
    const extractedDynamicFields: Record<string, string> = {};
    Object.keys(session).forEach(key => {
      if (!standardKeys.includes(key)) {
        extractedDynamicFields[key] = session[key];
      }
    });
    setDynamicFields(extractedDynamicFields);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.date) return;
    
    const finalSchool = newSession.school === 'custom' ? customSchool : newSession.school;

    onAdd({
      ...newSession,
      school: finalSchool || 'Khác',
      ...dynamicFields,
      id: `t${Date.now()}`,
    } as TeachingSession);
    
    setIsAddDialogOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      const finalSchool = editingSession.school === 'custom' ? customSchool : editingSession.school;

      const updatedSession: any = {
        ...editingSession,
        school: finalSchool || 'Khác',
      };

      Object.keys(updatedSession).forEach(key => {
        if (!standardKeys.includes(key)) {
          delete updatedSession[key];
        }
      });

      Object.assign(updatedSession, dynamicFields);

      onEdit(updatedSession as TeachingSession);
      setEditingSession(null);
    }
  };

  // Extract unique values
  const years = useMemo(() => Array.from(new Set(data.map(d => new Date(d.date).getFullYear().toString()))).sort(), [data]);
  
  const allSchools = useMemo(() => {
    const map = new Map<string, string>();
    data.map(d => d.school).filter(Boolean).forEach(s => {
      if (s && !map.has(s.toLowerCase())) map.set(s.toLowerCase(), s);
    });
    return Array.from(map.values()).sort();
  }, [data]);

  const dynamicColumns = useMemo(() => {
    const keys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(k => {
        if (!standardKeys.includes(k)) keys.add(k);
      });
    });
    return Array.from(keys);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const date = new Date(item.date);
      const month = (date.getMonth() + 1).toString();
      const year = date.getFullYear().toString();

      if (filterMonth !== 'all' && month !== filterMonth) return false;
      if (filterYear !== 'all' && year !== filterYear) return false;
      if (filterSchool !== 'all' && item.school?.toLowerCase() !== filterSchool.toLowerCase()) return false;
      return true;
    });
  }, [data, filterMonth, filterYear, filterSchool]);

  const totalPeriods = filteredData.reduce((sum, item) => sum + item.periods, 0);
  const totalIncome = filteredData.reduce((sum, item) => sum + item.totalPrice, 0);

  const renderDynamicFieldsSection = () => (
    <div className="col-span-2 border-t border-cyan-100 pt-4 mt-2">
      <label className="text-sm font-bold text-primary mb-2 block">Trường thông tin tùy chỉnh (Tự động tạo cột)</label>
      
      {Object.keys(dynamicFields).map(key => (
        <div key={key} className="flex items-center gap-2 mb-2">
          <div className="w-1/3 text-sm font-semibold text-[#0f3742]/80 truncate" title={key}>{key}</div>
          <Input 
            value={dynamicFields[key]} 
            onChange={e => setDynamicFields({...dynamicFields, [key]: e.target.value})} 
            className="flex-1 border-cyan-200"
            placeholder={`Nhập giá trị cho ${key}...`}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeDynamicField(key)}>
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-2 mt-3">
        <Input 
          placeholder="Tên trường mới (VD: Số điện thoại, Đánh giá...)" 
          value={newFieldName}
          onChange={e => setNewFieldName(e.target.value)}
          className="border-cyan-200 bg-cyan-50/50"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDynamicField())}
        />
        <Button type="button" variant="secondary" onClick={handleAddDynamicField} className="whitespace-nowrap font-bold">
          + Thêm trường
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="shadow-sm bg-gradient-to-br from-white to-cyan-50/50 border-cyan-100">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-[#0f3742]">Bộ lọc Dạy KNS</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={openAddDialog}>
            <DialogTrigger render={<Button className="bg-accent hover:bg-accent/90 text-white shadow-md font-bold" />}>
              <Plus className="mr-2 h-4 w-4" /> Nhập liệu
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white text-[#0f3742] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#0f3742]">Thêm tiết dạy mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Ngày</label>
                    <Input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="border-cyan-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Trường</label>
                    <Select value={newSession.school} onValueChange={v => setNewSession({...newSession, school: v})}>
                      <SelectTrigger className="border-cyan-200"><SelectValue placeholder="Chọn trường..." /></SelectTrigger>
                      <SelectContent>
                        {allSchools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        <SelectItem value="custom" className="font-bold text-accent">+ Nhập tên trường mới...</SelectItem>
                      </SelectContent>
                    </Select>
                    {newSession.school === 'custom' && (
                      <Input placeholder="Nhập tên trường..." value={customSchool} onChange={e => setCustomSchool(e.target.value)} className="mt-2 border-accent" autoFocus required />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Lớp</label>
                    <Input required placeholder="VD: 10A1" value={newSession.className} onChange={e => setNewSession({...newSession, className: e.target.value})} className="border-cyan-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Số tiết</label>
                    <Input type="number" min="1" required value={newSession.periods} onChange={e => setNewSession({...newSession, periods: parseInt(e.target.value) || 0})} className="border-cyan-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Đơn giá (VNĐ)</label>
                    <Input type="number" min="0" required value={newSession.unitPrice} onChange={e => setNewSession({...newSession, unitPrice: parseInt(e.target.value) || 0})} className="border-cyan-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Thành tiền (VNĐ)</label>
                    <Input type="number" readOnly value={newSession.totalPrice} className="bg-cyan-50 border-cyan-200 font-bold text-accent" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold">Ghi chú</label>
                    <Input value={newSession.notes} onChange={e => setNewSession({...newSession, notes: e.target.value})} className="border-cyan-200" />
                  </div>

                  {renderDynamicFieldsSection()}
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-accent hover:bg-accent/90 font-bold">Lưu dữ liệu</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0f3742]/70">Năm</label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0f3742]/70">Tháng</label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <SelectItem key={m} value={m.toString()}>Tháng {m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0f3742]/70">Trường</label>
              <Select value={filterSchool} onValueChange={setFilterSchool}>
                <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {allSchools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-cyan-100">
        <CardHeader className="flex flex-row items-center justify-between bg-cyan-50/30 border-b border-cyan-100">
          <CardTitle className="text-[#0f3742]">Danh sách Dạy KNS ({filteredData.length} buổi)</CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="font-bold bg-primary/10 text-primary px-3 py-1 rounded-full shadow-inner">Tổng số tiết: {totalPeriods}</div>
            <div className="font-bold bg-accent/10 text-accent px-3 py-1 rounded-full shadow-inner">Tổng thu nhập: {totalIncome.toLocaleString('vi-VN')} đ</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-md overflow-x-auto">
            <Table>
              <TableHeader className="bg-cyan-50/50">
                <TableRow>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Ngày</TableHead>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Trường</TableHead>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Lớp</TableHead>
                  <TableHead className="text-right font-extrabold text-[#0f3742] whitespace-nowrap">Số tiết</TableHead>
                  <TableHead className="text-right font-extrabold text-[#0f3742] whitespace-nowrap">Đơn giá</TableHead>
                  <TableHead className="text-right font-extrabold text-[#0f3742] whitespace-nowrap">Thành tiền</TableHead>
                  
                  {/* Render Dynamic Column Headers */}
                  {dynamicColumns.map(col => (
                    <TableHead key={col} className="font-extrabold text-accent whitespace-nowrap bg-cyan-50/80">{col}</TableHead>
                  ))}

                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Ghi chú</TableHead>
                  <TableHead className="text-center font-extrabold text-[#0f3742] whitespace-nowrap sticky right-0 bg-cyan-50/50">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8 + dynamicColumns.length} className="text-center py-12 text-[#0f3742]/60 font-medium">Không có dữ liệu phù hợp với bộ lọc.</TableCell>
                  </TableRow>
                ) : (
                  filteredData.map(item => (
                    <TableRow key={item.id} className="hover:bg-cyan-50/30 transition-colors">
                      <TableCell className="font-bold text-[#0f3742] whitespace-nowrap">{new Date(item.date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="font-bold text-accent whitespace-nowrap">{item.school}</TableCell>
                      <TableCell className="font-semibold text-[#0f3742]/80 whitespace-nowrap">{item.className}</TableCell>
                      <TableCell className="text-right font-extrabold text-[#0f3742] whitespace-nowrap">{item.periods}</TableCell>
                      <TableCell className="text-right font-semibold text-[#0f3742]/70 whitespace-nowrap">{item.unitPrice.toLocaleString('vi-VN')} đ</TableCell>
                      <TableCell className="text-right font-extrabold text-accent whitespace-nowrap">{item.totalPrice.toLocaleString('vi-VN')} đ</TableCell>
                      
                      {/* Render Dynamic Column Data */}
                      {dynamicColumns.map(col => (
                        <TableCell key={col} className="text-[#0f3742]/80 font-medium whitespace-nowrap bg-cyan-50/20">{item[col] || '-'}</TableCell>
                      ))}

                      <TableCell className="text-[#0f3742]/60 text-sm font-medium max-w-[200px] truncate" title={item.notes}>{item.notes}</TableCell>
                      <TableCell className="sticky right-0 bg-white/90 backdrop-blur-sm shadow-[-4px_0_6px_-1px_rgb(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-accent hover:text-accent hover:bg-accent/10" onClick={() => openEditDialog(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeletingId(item.id)}>
                            <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white text-[#0f3742] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#0f3742]">Sửa tiết dạy</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Ngày</label>
                  <Input type="date" required value={editingSession.date} onChange={e => setEditingSession({...editingSession, date: e.target.value})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Trường</label>
                  <Select value={editingSession.school} onValueChange={v => setEditingSession({...editingSession, school: v})}>
                    <SelectTrigger className="border-cyan-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allSchools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      <SelectItem value="custom" className="font-bold text-accent">+ Nhập tên trường mới...</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingSession.school === 'custom' && (
                    <Input placeholder="Nhập tên trường mới..." value={customSchool} onChange={e => setCustomSchool(e.target.value)} className="mt-2 border-accent" autoFocus required />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Lớp</label>
                  <Input required placeholder="VD: 10A1" value={editingSession.className} onChange={e => setEditingSession({...editingSession, className: e.target.value})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Số tiết</label>
                  <Input type="number" min="1" required value={editingSession.periods} onChange={e => setEditingSession({...editingSession, periods: parseInt(e.target.value) || 0})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Đơn giá (VNĐ)</label>
                  <Input type="number" min="0" required value={editingSession.unitPrice} onChange={e => setEditingSession({...editingSession, unitPrice: parseInt(e.target.value) || 0})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Thành tiền (VNĐ)</label>
                  <Input type="number" readOnly value={editingSession.totalPrice} className="bg-cyan-50 border-cyan-200 font-bold text-accent" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-bold">Ghi chú</label>
                  <Input value={editingSession.notes || ''} onChange={e => setEditingSession({...editingSession, notes: e.target.value})} className="border-cyan-200" />
                </div>

                {renderDynamicFieldsSection()}
              </div>
              <div className="flex justify-end pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingSession(null)} className="font-bold">Hủy</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 font-bold">Cập nhật</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-[400px] bg-white text-[#0f3742]">
          <DialogHeader>
            <DialogTitle className="text-[#0f3742]">Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#0f3742]/80 font-medium">Bạn có chắc chắn muốn xóa tiết dạy này không? Hành động này không thể hoàn tác.</p>
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

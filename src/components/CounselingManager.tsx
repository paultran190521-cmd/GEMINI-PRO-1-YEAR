import React, { useState, useMemo, useEffect } from 'react';
import { CounselingSession } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface CounselingManagerProps {
  data: CounselingSession[];
  onAdd: (session: CounselingSession) => void;
  onEdit: (session: CounselingSession) => void;
  onDelete: (id: string) => void;
}

const standardKeys = ['id', 'date', 'format', 'type', 'client', 'startTime', 'endTime', 'duration', 'postCount', 'notes'];

export default function CounselingManager({ data, onAdd, onEdit, onDelete }: CounselingManagerProps) {
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CounselingSession | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Custom Formats & Types
  const [customFormat, setCustomFormat] = useState('');
  const [customType, setCustomType] = useState('');

  // Dynamic Fields
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [newFieldName, setNewFieldName] = useState('');

  const [newSession, setNewSession] = useState<Partial<CounselingSession>>({
    date: new Date().toISOString().split('T')[0],
    format: 'Trực tiếp',
    type: 'Tham vấn',
    client: '',
    startTime: '',
    endTime: '',
    duration: 0,
    postCount: 0,
    notes: ''
  });

  // Calculate duration automatically for newSession
  useEffect(() => {
    if (newSession.startTime && newSession.endTime) {
      const [sh, sm] = newSession.startTime.split(':').map(Number);
      const [eh, em] = newSession.endTime.split(':').map(Number);
      let duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 24 * 60; // handle overnight if any
      setNewSession(prev => ({ ...prev, duration }));
    }
  }, [newSession.startTime, newSession.endTime]);

  // Calculate duration automatically for editingSession
  useEffect(() => {
    if (editingSession?.startTime && editingSession?.endTime) {
      const [sh, sm] = editingSession.startTime.split(':').map(Number);
      const [eh, em] = editingSession.endTime.split(':').map(Number);
      let duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 24 * 60; // handle overnight if any
      setEditingSession(prev => prev ? { ...prev, duration } : null);
    }
  }, [editingSession?.startTime, editingSession?.endTime]);

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
      setCustomFormat('');
      setCustomType('');
      setNewSession({
        date: new Date().toISOString().split('T')[0],
        format: 'Trực tiếp',
        type: 'Tham vấn',
        client: '',
        startTime: '',
        endTime: '',
        duration: 0,
        postCount: 0,
        notes: ''
      });
    }
  };

  const openEditDialog = (session: CounselingSession) => {
    setEditingSession(session);
    setCustomFormat('');
    setCustomType('');
    
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
    if (!newSession.client || !newSession.date) return;
    
    const finalFormat = newSession.format === 'custom' ? customFormat : newSession.format;
    const finalType = newSession.type === 'custom' ? customType : newSession.type;

    onAdd({
      ...newSession,
      format: finalFormat || 'Khác',
      type: finalType || 'Khác',
      ...dynamicFields,
      id: `c${Date.now()}`,
    } as CounselingSession);
    
    setIsAddDialogOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      const finalFormat = editingSession.format === 'custom' ? customFormat : editingSession.format;
      const finalType = editingSession.type === 'custom' ? customType : editingSession.type;

      // Create a clean object with standard keys + dynamic fields
      const updatedSession: any = {
        ...editingSession,
        format: finalFormat || 'Khác',
        type: finalType || 'Khác',
      };

      // Remove old dynamic fields that might have been deleted
      Object.keys(updatedSession).forEach(key => {
        if (!standardKeys.includes(key)) {
          delete updatedSession[key];
        }
      });

      // Add current dynamic fields
      Object.assign(updatedSession, dynamicFields);

      onEdit(updatedSession as CounselingSession);
      setEditingSession(null);
    }
  };

  // Helper to capitalize first letter
  const capitalizeFirstLetter = (string: string) => {
    if (!string) return string;
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  // Extract unique values for filters and dynamic columns
  const years = useMemo(() => Array.from(new Set(data.map(d => new Date(d.date).getFullYear().toString()))).sort(), [data]);
  
  const defaultFormats = ['Trực tiếp', 'Online', 'Tổng đài'];
  const allFormats = useMemo(() => {
    const map = new Map<string, string>();
    [...defaultFormats, ...data.map(d => d.format)].forEach(f => {
      if (f) {
        const normalized = capitalizeFirstLetter(f);
        if (!map.has(normalized.toLowerCase())) map.set(normalized.toLowerCase(), normalized);
      }
    });
    return Array.from(map.values()).sort();
  }, [data]);
  
  const defaultTypes = ['Tham vấn', 'Melis', 'Học đường'];
  const allTypes = useMemo(() => {
    const map = new Map<string, string>();
    [...defaultTypes, ...data.map(d => d.type)].forEach(t => {
      if (t) {
        const normalized = capitalizeFirstLetter(t);
        if (!map.has(normalized.toLowerCase())) map.set(normalized.toLowerCase(), normalized);
      }
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
      if (filterFormat !== 'all' && item.format?.toLowerCase() !== filterFormat.toLowerCase()) return false;
      if (filterType !== 'all' && item.type?.toLowerCase() !== filterType.toLowerCase()) return false;
      if (filterClient && !item.client?.toLowerCase().includes(filterClient.toLowerCase())) return false;
      return true;
    });
  }, [data, filterMonth, filterYear, filterFormat, filterType, filterClient]);

  const totalDuration = filteredData.reduce((sum, item) => sum + item.duration, 0);
  const totalPosts = filteredData.reduce((sum, item) => sum + (item.postCount || 0), 0);

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
          <CardTitle className="text-[#0f3742]">Bộ lọc Tham vấn</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={openAddDialog}>
            <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white shadow-md font-bold" />}>
              <Plus className="mr-2 h-4 w-4" /> Nhập liệu
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white text-[#0f3742] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[#0f3742]">Thêm ca tham vấn mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Ngày</label>
                    <Input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="border-cyan-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Thân chủ / Tình huống</label>
                    <Input required placeholder="Nhập tên..." value={newSession.client} onChange={e => setNewSession({...newSession, client: e.target.value})} className="border-cyan-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Hình thức</label>
                    <Select value={newSession.format} onValueChange={v => setNewSession({...newSession, format: v})}>
                      <SelectTrigger className="border-cyan-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allFormats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        <SelectItem value="custom" className="font-bold text-primary">+ Nhập hình thức khác...</SelectItem>
                      </SelectContent>
                    </Select>
                    {newSession.format === 'custom' && (
                      <Input placeholder="Nhập hình thức mới..." value={customFormat} onChange={e => setCustomFormat(e.target.value)} className="mt-2 border-primary" autoFocus required />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Loại tham vấn</label>
                    <Select value={newSession.type} onValueChange={v => setNewSession({...newSession, type: v})}>
                      <SelectTrigger className="border-cyan-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        <SelectItem value="custom" className="font-bold text-primary">+ Nhập loại khác...</SelectItem>
                      </SelectContent>
                    </Select>
                    {newSession.type === 'custom' && (
                      <Input placeholder="Nhập loại mới..." value={customType} onChange={e => setCustomType(e.target.value)} className="mt-2 border-primary" autoFocus required />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Giờ bắt đầu</label>
                    <Input type="time" value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} className="border-cyan-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Giờ kết thúc</label>
                    <Input type="time" value={newSession.endTime} onChange={e => setNewSession({...newSession, endTime: e.target.value})} className="border-cyan-200" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Thời lượng (phút)</label>
                    <Input type="number" readOnly value={newSession.duration} className="bg-cyan-50 border-cyan-200 font-bold text-primary" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Số bài (nếu có)</label>
                    <Input type="number" value={newSession.postCount} onChange={e => setNewSession({...newSession, postCount: parseInt(e.target.value) || 0})} className="border-cyan-200" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold">Ghi chú</label>
                    <Input value={newSession.notes} onChange={e => setNewSession({...newSession, notes: e.target.value})} className="border-cyan-200" />
                  </div>
                  
                  {renderDynamicFieldsSection()}
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold">Lưu dữ liệu</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="text-sm font-bold text-[#0f3742]/70">Hình thức</label>
              <Select value={filterFormat} onValueChange={setFilterFormat}>
                <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {allFormats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0f3742]/70">Loại tham vấn</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {allTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0f3742]/70">Thân chủ</label>
              <Input 
                placeholder="Tìm tên..." 
                value={filterClient} 
                onChange={(e) => setFilterClient(e.target.value)}
                className="shadow-sm bg-white border-cyan-100 text-[#0f3742]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-cyan-100">
        <CardHeader className="flex flex-row items-center justify-between bg-cyan-50/30 border-b border-cyan-100">
          <CardTitle className="text-[#0f3742]">Danh sách Tham vấn ({filteredData.length} ca)</CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="font-bold bg-primary/10 text-primary px-3 py-1 rounded-full shadow-inner">Tổng thời lượng: {totalDuration} phút</div>
            {totalPosts > 0 && <div className="font-bold bg-accent/10 text-accent px-3 py-1 rounded-full shadow-inner">Tổng số bài: {totalPosts} bài</div>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-md overflow-x-auto">
            <Table>
              <TableHeader className="bg-cyan-50/50">
                <TableRow>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Ngày</TableHead>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Hình thức</TableHead>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Loại</TableHead>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Thân chủ / Tình huống</TableHead>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Bắt đầu</TableHead>
                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Kết thúc</TableHead>
                  <TableHead className="text-right font-extrabold text-[#0f3742] whitespace-nowrap">Thời lượng (phút)</TableHead>
                  <TableHead className="text-right font-extrabold text-[#0f3742] whitespace-nowrap">Số bài</TableHead>
                  
                  {/* Render Dynamic Column Headers */}
                  {dynamicColumns.map(col => (
                    <TableHead key={col} className="font-extrabold text-primary whitespace-nowrap bg-cyan-50/80">{col}</TableHead>
                  ))}

                  <TableHead className="font-extrabold text-[#0f3742] whitespace-nowrap">Ghi chú</TableHead>
                  <TableHead className="text-center font-extrabold text-[#0f3742] whitespace-nowrap sticky right-0 bg-cyan-50/50">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10 + dynamicColumns.length} className="text-center py-12 text-[#0f3742]/60 font-medium">Không có dữ liệu phù hợp với bộ lọc.</TableCell>
                  </TableRow>
                ) : (
                  filteredData.map(item => (
                    <TableRow key={item.id} className="hover:bg-cyan-50/30 transition-colors">
                      <TableCell className="font-bold text-[#0f3742] whitespace-nowrap">{new Date(item.date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className={
                          item.format?.toLowerCase() === 'online' ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' : 
                          item.format?.toLowerCase() === 'trực tiếp' ? 'bg-green-50 text-green-700 border-green-200 font-bold' : 
                          'bg-orange-50 text-orange-700 border-orange-200 font-bold'
                        }>
                          {capitalizeFirstLetter(item.format)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-[#0f3742]/80 whitespace-nowrap">{capitalizeFirstLetter(item.type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-bold text-[#0f3742]" title={item.client}>{item.client}</TableCell>
                      <TableCell className="text-[#0f3742]/70 font-semibold whitespace-nowrap">{item.startTime || '-'}</TableCell>
                      <TableCell className="text-[#0f3742]/70 font-semibold whitespace-nowrap">{item.endTime || '-'}</TableCell>
                      <TableCell className="text-right font-extrabold text-primary whitespace-nowrap">{item.duration > 0 ? item.duration : '-'}</TableCell>
                      <TableCell className="text-right font-bold text-[#0f3742] whitespace-nowrap">{item.postCount || '-'}</TableCell>
                      
                      {/* Render Dynamic Column Data */}
                      {dynamicColumns.map(col => (
                        <TableCell key={col} className="text-[#0f3742]/80 font-medium whitespace-nowrap bg-cyan-50/20">{item[col] || '-'}</TableCell>
                      ))}

                      <TableCell className="text-[#0f3742]/60 text-sm font-medium max-w-[200px] truncate" title={item.notes}>{item.notes}</TableCell>
                      <TableCell className="sticky right-0 bg-white/90 backdrop-blur-sm shadow-[-4px_0_6px_-1px_rgb(0,0,0,0.05)]">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => openEditDialog(item)}>
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
            <DialogTitle className="text-[#0f3742]">Sửa ca tham vấn</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <form onSubmit={handleEditSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Ngày</label>
                  <Input type="date" required value={editingSession.date} onChange={e => setEditingSession({...editingSession, date: e.target.value})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Thân chủ / Tình huống</label>
                  <Input required placeholder="Nhập tên..." value={editingSession.client} onChange={e => setEditingSession({...editingSession, client: e.target.value})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Hình thức</label>
                  <Select value={editingSession.format} onValueChange={v => setEditingSession({...editingSession, format: v})}>
                    <SelectTrigger className="border-cyan-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allFormats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      <SelectItem value="custom" className="font-bold text-primary">+ Nhập hình thức khác...</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingSession.format === 'custom' && (
                    <Input placeholder="Nhập hình thức mới..." value={customFormat} onChange={e => setCustomFormat(e.target.value)} className="mt-2 border-primary" autoFocus required />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Loại tham vấn</label>
                  <Select value={editingSession.type} onValueChange={v => setEditingSession({...editingSession, type: v})}>
                    <SelectTrigger className="border-cyan-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      <SelectItem value="custom" className="font-bold text-primary">+ Nhập loại khác...</SelectItem>
                    </SelectContent>
                  </Select>
                  {editingSession.type === 'custom' && (
                    <Input placeholder="Nhập loại mới..." value={customType} onChange={e => setCustomType(e.target.value)} className="mt-2 border-primary" autoFocus required />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Giờ bắt đầu</label>
                  <Input type="time" value={editingSession.startTime || ''} onChange={e => setEditingSession({...editingSession, startTime: e.target.value})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Giờ kết thúc</label>
                  <Input type="time" value={editingSession.endTime || ''} onChange={e => setEditingSession({...editingSession, endTime: e.target.value})} className="border-cyan-200" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Thời lượng (phút)</label>
                  <Input type="number" readOnly value={editingSession.duration} className="bg-cyan-50 border-cyan-200 font-bold text-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Số bài (nếu có)</label>
                  <Input type="number" value={editingSession.postCount || 0} onChange={e => setEditingSession({...editingSession, postCount: parseInt(e.target.value) || 0})} className="border-cyan-200" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-bold">Ghi chú</label>
                  <Input value={editingSession.notes || ''} onChange={e => setEditingSession({...editingSession, notes: e.target.value})} className="border-cyan-200" />
                </div>

                {renderDynamicFieldsSection()}
              </div>
              <div className="flex justify-end pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingSession(null)} className="font-bold">Hủy</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold">Cập nhật</Button>
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
            <p className="text-[#0f3742]/80 font-medium">Bạn có chắc chắn muốn xóa ca tham vấn này không? Hành động này không thể hoàn tác.</p>
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

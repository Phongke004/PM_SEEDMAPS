import { useState, useEffect, useCallback, useRef } from 'react';
import { type AppEvent, type Attendee } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { PageHeader, LoadingSpinner, ErrorBanner } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import {
  Plus,
  Users,
  Pencil,
  Trash2,
  Search,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chưa bố trí', color: 'bg-gray-100 text-gray-600' },
  assigned: { label: 'Đã bố trí', color: 'bg-brand-100 text-brand-700' },
  absent: { label: 'Vắng mặt', color: 'bg-red-100 text-red-700' },
  attended: { label: 'Đã tham dự', color: 'bg-green-100 text-green-700' },
};

export function AttendeesPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState<Attendee | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    department: '',
    phone: '',
    email: '',
    notes: '',
    title: '',
    position: '',
    degree: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = useCallback(async () => {
    const data = await dataService.getEvents();
    const eventsData = data || [];
    setEvents(eventsData);
    if (eventsData.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsData[0].id);
    }
  }, [selectedEventId]);

  const fetchAttendees = useCallback(async () => {
    if (!selectedEventId) {
      setAttendees([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await dataService.getAttendees(selectedEventId);
      setAttendees(data || []);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }, [selectedEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  const openCreate = () => {
    setEditingAttendee(null);
    setForm({ full_name: '', department: '', phone: '', email: '', notes: '', title: '', position: '', degree: '' });
    setShowModal(true);
  };

  const openEdit = (att: Attendee) => {
    setEditingAttendee(att);
    setForm({
      full_name: att.full_name,
      department: att.department || '',
      phone: att.phone || '',
      email: att.email || '',
      notes: att.notes || '',
      title: att.title || '',
      position: att.position || '',
      degree: att.degree || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !selectedEventId) return;
    setSaving(true);
    setError('');

    const payload = {
      event_id: selectedEventId,
      full_name: form.full_name.trim(),
      department: form.department.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      title: form.title.trim(),
      position: form.position.trim(),
      degree: form.degree.trim(),
    };

    try {
      if (editingAttendee) {
        await dataService.updateAttendee(editingAttendee.id, payload);
        showToast('Đã cập nhật người tham dự thành công', 'success');
      } else {
        await dataService.createAttendee(payload);
        showToast('Đã thêm người tham dự thành công', 'success');
      }
    } catch (err: any) {
      setError(err.message);
    }

    setSaving(false);
    if (!error) {
      setShowModal(false);
      fetchAttendees();
    }
  };

  const handleDelete = async (att: Attendee) => {
    const confirmed = await confirm({
      title: 'Xóa người tham dự',
      message: `Xóa "${att.full_name}" khỏi danh sách?`,
      danger: true,
      confirmText: 'Xóa',
    });
    if (!confirmed) return;
    try {
      await dataService.deleteAttendee(att.id);
      showToast('Đã xóa người tham dự thành công', 'success');
      fetchAttendees();
    } catch (err: any) {
      setError(err.message);
      showToast('Không thể xóa: ' + err.message, 'error');
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      ['Họ tên', 'Khoa/Phòng', 'SĐT', 'Email', 'Quân hàm', 'Chức vụ', 'Học vị', 'Ghi chú'],
      ['Nguyễn Văn A', 'Khoa Tim mạch', '0901234567', 'nguyenvana@bv.vn', 'GS.TS', 'Giám đốc', 'Tiến sĩ', 'Khách VIP'],
      ['Trần Thị B', 'Khoa Nội', '0987654321', 'tranthib@bv.vn', 'ThS.BS', 'Trưởng khoa', 'Thạc sĩ', '']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Auto size columns
    const wscols = [
      {wch: 25}, // Họ tên
      {wch: 20}, // Khoa/Phòng
      {wch: 15}, // SĐT
      {wch: 25}, // Email
      {wch: 15}, // Quân hàm
      {wch: 20}, // Chức vụ
      {wch: 15}, // Học vị
      {wch: 25}, // Ghi chú
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh_sach_nguoi_tham_du");
    XLSX.writeFile(wb, "Template_Nguoi_Tham_Du.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to array of arrays, skipping header row if it exists
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        
        if (data.length <= 1) {
          showToast('File không có dữ liệu', 'error');
          return;
        }

        // Assuming first row is header
        const rows = data.slice(1).map((parts: any[]) => {
          return {
            event_id: selectedEventId,
            full_name: parts[0] ? String(parts[0]).trim() : '',
            department: parts[1] ? String(parts[1]).trim() : '',
            phone: parts[2] ? String(parts[2]).trim() : '',
            email: parts[3] ? String(parts[3]).trim() : '',
            title: parts[4] ? String(parts[4]).trim() : '',
            position: parts[5] ? String(parts[5]).trim() : '',
            degree: parts[6] ? String(parts[6]).trim() : '',
            notes: parts[7] ? String(parts[7]).trim() : '',
            status: 'pending'
          };
        }).filter((r) => r.full_name);

        if (rows.length === 0) {
          showToast('Không tìm thấy dòng dữ liệu hợp lệ nào', 'error');
          return;
        }

        dataService.importAttendees(selectedEventId, rows).then(() => {
          showToast(`Đã nhập ${rows.length} người tham dự thành công`, 'success');
          fetchAttendees();
        }).catch(err => {
          showToast('Nhập nhanh thất bại: ' + err.message, 'error');
        });
      } catch (error: any) {
        showToast('Lỗi khi đọc file Excel: ' + error.message, 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filtered = attendees.filter(
    (a) =>
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search)
  );

  const pendingCount = attendees.filter((a) => a.status === 'pending').length;
  const assignedCount = attendees.filter((a) => a.status === 'assigned').length;

  return (
    <div>
      <PageHeader
        title="Người tham dự"
        subtitle="Quản lý danh sách người tham dự sự kiện"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button className="btn-secondary" onClick={handleDownloadTemplate}>
              <Download size={18} /> Tải file mẫu
            </button>
            <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={!selectedEventId}>
              <FileSpreadsheet size={18} /> Nhập từ Excel
            </button>
            <button className="btn-primary" onClick={openCreate} disabled={!selectedEventId}>
              <Plus size={18} /> Thêm người
            </button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Event selector + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          className="input sm:max-w-xs"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          <option value="">-- Chọn sự kiện --</option>
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.name}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Tìm theo tên, khoa, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!selectedEventId}
          />
        </div>
      </div>

      {/* Stats */}
      {selectedEventId && !loading && attendees.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{attendees.length}</div>
            <div className="text-xs text-gray-500">Tổng số</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-brand-600">{assignedCount}</div>
            <div className="text-xs text-gray-500">Đã bố trí</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-gray-400">{pendingCount}</div>
            <div className="text-xs text-gray-500">Chưa bố trí</div>
          </div>
        </div>
      )}

      {!selectedEventId ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Chọn sự kiện"
          description="Vui lòng chọn một sự kiện để xem và quản lý người tham dự"
        />
      ) : loading ? (
        <LoadingSpinner label="Đang tải danh sách..." />
      ) : attendees.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Chưa có người tham dự"
          description="Thêm người tham dự hoặc nhập nhanh danh sách"
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={18} /> Thêm người
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Họ tên</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Quân hàm/Học vị</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Chức vụ</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Khoa/Phòng</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">SĐT</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((att) => {
                  const statusCfg = STATUS_CONFIG[att.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={att.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{att.full_name}</div>
                        {att.notes && <div className="text-xs text-gray-400 mt-0.5">{att.notes}</div>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{att.title || att.degree || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{att.position || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{att.department || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{att.phone || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{att.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statusCfg.color}`}>{statusCfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(att)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                            title="Sửa"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(att)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAttendee ? 'Chỉnh sửa người tham dự' : 'Thêm người tham dự'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Họ tên *</label>
            <input
              className="input"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="VD: BS. Nguyễn Văn A"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Quân hàm</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VD: GS.TS, ThS"
              />
            </div>
            <div>
              <label className="label">Chức vụ</label>
              <input
                className="input"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="VD: Giám đốc"
              />
            </div>
            <div>
              <label className="label">Học vị</label>
              <input
                className="input"
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
                placeholder="VD: Tiến sĩ"
              />
            </div>
          </div>
          <div>
            <label className="label">Khoa / Phòng</label>
            <input
              className="input"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="VD: Khoa Tim mạch"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Số điện thoại</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@bv.vn"
              />
            </div>
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ghi chú thêm..."
            />
          </div>
          {error && <ErrorBanner message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>
              Hủy
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.full_name.trim()}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

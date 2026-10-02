import { useState, useEffect, useCallback } from 'react';
import { supabase, type AppEvent, type Attendee } from '@/lib/supabase';
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
} from 'lucide-react';
import { useToast } from '@/components/Toast';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chưa bố trí', color: 'bg-gray-100 text-gray-600' },
  assigned: { label: 'Đã bố trí', color: 'bg-brand-100 text-brand-700' },
  absent: { label: 'Vắng mặt', color: 'bg-red-100 text-red-700' },
  attended: { label: 'Đã tham dự', color: 'bg-green-100 text-green-700' },
};

export function AttendeesPage() {
  const { showToast } = useToast();
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

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    const eventsData = (data as AppEvent[]) || [];
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
    const { data, error: err } = await supabase
      .from('attendees')
      .select('*')
      .eq('event_id', selectedEventId)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setAttendees((data as Attendee[]) || []);
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

    if (editingAttendee) {
      const { error: err } = await supabase.from('attendees').update(payload).eq('id', editingAttendee.id);
      if (err) setError(err.message);
      else showToast('Đã cập nhật người tham dự thành công', 'success');
    } else {
      const { error: err } = await supabase.from('attendees').insert(payload);
      if (err) setError(err.message);
      else showToast('Đã thêm người tham dự thành công', 'success');
    }

    setSaving(false);
    if (!error) {
      setShowModal(false);
      fetchAttendees();
    }
  };

  const handleDelete = async (att: Attendee) => {
    if (!confirm(`Xóa "${att.full_name}" khỏi danh sách?`)) return;
    const { error: err } = await supabase.from('attendees').delete().eq('id', att.id);
    if (err) {
      setError(err.message);
      showToast('Không thể xóa: ' + err.message, 'error');
      return;
    }
    showToast('Đã xóa người tham dự thành công', 'success');
    fetchAttendees();
  };

  const handleBulkImport = () => {
    const text = prompt(
      'Dán danh sách người tham dự (mỗi dòng 1 người).\nĐịnh dạng: Tên, Khoa, SĐT, Email, Quân hàm, Chức vụ, Học vị\nVD: Nguyễn Văn A, Khoa Tim mạch, 0901234567, a@bv.vn, GS.TS, Giám đốc, Tiến sĩ'
    );
    if (!text || !selectedEventId) return;

    const lines = text.trim().split('\n');
    const rows = lines
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return {
          event_id: selectedEventId,
          full_name: parts[0] || '',
          department: parts[1] || '',
          phone: parts[2] || '',
          email: parts[3] || '',
          notes: '',
          status: 'pending',
          title: parts[4] || '',
          position: parts[5] || '',
          degree: parts[6] || '',
        };
      })
      .filter((r) => r.full_name);

    if (rows.length === 0) return;

    supabase.from('attendees').insert(rows).then(({ error: err }) => {
      if (err) {
        showToast('Nhập nhanh thất bại: ' + err.message, 'error');
      } else {
        showToast(`Đã nhập ${rows.length} người tham dự thành công`, 'success');
        fetchAttendees();
      }
    });
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
          <>
            <button className="btn-secondary" onClick={handleBulkImport} disabled={!selectedEventId}>
              <Upload size={18} /> Nhập nhanh
            </button>
            <button className="btn-primary" onClick={openCreate} disabled={!selectedEventId}>
              <Plus size={18} /> Thêm người
            </button>
          </>
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

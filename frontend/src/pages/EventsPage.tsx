import { useState, useEffect, useCallback, useRef } from 'react';
import { type Hall, type AppEvent } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { PageHeader, LoadingSpinner, ErrorBanner } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { Plus, CalendarDays, Pencil, Trash2, Clock, MapPin, Users } from 'lucide-react';

type EventWithStats = AppEvent & {
  hall_name: string;
  attendee_count: number;
  assignment_count: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planning: { label: 'Đang lên kế hoạch', color: 'bg-gray-100 text-gray-600' },
  open: { label: 'Đang mở', color: 'bg-blue-100 text-blue-700' },
  assigned: { label: 'Đã bố trí', color: 'bg-brand-100 text-brand-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
};

export function EventsPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    hall_id: '',
    event_date: '',
    status: 'planning',
  });
  const hallsRef = useRef<Hall[]>([]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const eventsData = await dataService.getEvents();
      const eventsWithStats: EventWithStats[] = eventsData.map((evt: any) => ({
        ...evt,
        hall_name: evt.hall_name || 'Không xác định',
        attendee_count: evt.total_attendees ?? 0,
        assignment_count: evt.assigned_count ?? 0,
      }));
      setEvents(eventsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải sự kiện');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHalls = useCallback(async () => {
    try {
      const hallsData = await dataService.getHalls();
      hallsRef.current = hallsData;
      setHalls(hallsData);
    } catch (err) {
      console.warn('Lỗi tải danh sách hội trường');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchHalls();
      await fetchEvents();
    })();
  }, [fetchHalls, fetchEvents]);

  const openCreate = () => {
    setEditingEvent(null);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setForm({
      name: '',
      description: '',
      hall_id: halls[0]?.id || '',
      event_date: now.toISOString().slice(0, 16),
      status: 'planning',
    });
    setShowModal(true);
  };

  const openEdit = (evt: AppEvent) => {
    setEditingEvent(evt);
    const dt = new Date(evt.event_date);
    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
    setForm({
      name: evt.name,
      description: evt.description,
      hall_id: evt.hall_id,
      event_date: dt.toISOString().slice(0, 16),
      status: evt.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.hall_id) return;
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      hall_id: form.hall_id,
      event_date: new Date(form.event_date).toISOString(),
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingEvent) {
        await dataService.updateEvent(editingEvent.id, payload);
      } else {
        await dataService.createEvent(payload);
      }
      setShowModal(false);
      showToast(editingEvent ? 'Đã cập nhật sự kiện thành công' : 'Đã tạo sự kiện mới thành công', 'success');
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (evt: AppEvent) => {
    const confirmed = await confirm({
      title: 'Xóa sự kiện',
      message: `Xóa sự kiện "${evt.name}"? Tất cả người tham dự và bố trí chỗ sẽ bị xóa.`,
      danger: true,
      confirmText: 'Xóa',
    });
    if (!confirmed) return;
    try {
      await dataService.deleteEvent(evt.id);
      showToast('Đã xóa sự kiện thành công', 'success');
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xóa sự kiện');
      showToast('Không thể xóa sự kiện', 'error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && events.length === 0) return <LoadingSpinner label="Đang tải sự kiện..." />;

  return (
    <div>
      <PageHeader
        title="Sự kiện"
        subtitle="Quản lý các sự kiện tại hội trường"
        actions={
          <button className="btn-primary" onClick={openCreate} disabled={halls.length === 0}>
            <Plus size={18} /> Thêm sự kiện
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {halls.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={32} />}
          title="Cần tạo hội trường trước"
          description="Vui lòng tạo ít nhất một hội trường trước khi thêm sự kiện"
        />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={32} />}
          title="Chưa có sự kiện"
          description="Tạo sự kiện đầu tiên để bắt đầu quản lý người tham dự và bố trí chỗ ngồi"
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={18} /> Thêm sự kiện
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => {
            const statusCfg = STATUS_CONFIG[evt.status] || STATUS_CONFIG.planning;
            return (
              <div key={evt.id} className="card p-5 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                    <CalendarDays size={24} />
                  </div>
                  <span className={`badge ${statusCfg.color}`}>{statusCfg.label}</span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-1">{evt.name}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[2.5rem]">
                  {evt.description || 'Không có mô tả'}
                </p>

                <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    {formatDate(evt.event_date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    {evt.hall_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    {evt.attendee_count} người tham dự · {evt.assignment_count} đã bố trí
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(evt)} className="btn-secondary flex-1 justify-center text-sm">
                    <Pencil size={14} /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(evt)}
                    className="btn-danger text-sm"
                    title="Xóa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Tên sự kiện *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Hội nghị khoa học 2026"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Mô tả</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về sự kiện..."
            />
          </div>
          <div>
            <label className="label">Hội trường *</label>
            <select
              className="input"
              value={form.hall_id}
              onChange={(e) => setForm({ ...form, hall_id: e.target.value })}
            >
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.row_count}×{h.col_count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Thời gian tổ chức</label>
            <input
              type="datetime-local"
              className="input"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Trạng thái</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
          {error && <ErrorBanner message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>
              Hủy
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name.trim() || !form.hall_id}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

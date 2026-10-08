import { useState, useEffect, useCallback } from 'react';
import { type Hall } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { PageHeader, LoadingSpinner, ErrorBanner } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import {
  Plus,
  Building2,
  Pencil,
  Trash2,
  Grid3x3,
  MapPin,
  Armchair,
} from 'lucide-react';

type HallWithStats = Hall & {
  element_count: number;
  chair_count: number;
  event_count: number;
};

type HallsPageProps = {
  onOpenDesigner: (hallId: string) => void;
};

export function HallsPage({ onOpenDesigner }: HallsPageProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [halls, setHalls] = useState<HallWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    row_count: 10,
    col_count: 10,
  });

  const [saving, setSaving] = useState(false);

  const fetchHalls = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const hallsData = await dataService.getHalls();
      const hallsWithStats: HallWithStats[] = hallsData.map((h: any) => ({
        ...h,
        element_count: h.element_count ?? h.elementCount ?? 0,
        chair_count: h.chair_count ?? h.chairCount ?? 0,
        event_count: h.event_count ?? h.eventCount ?? 0,
      }));

      setHalls(hallsWithStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách hội trường';
      setError(message);
      setHalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHalls();
  }, [fetchHalls]);

  const openCreate = () => {
    setError('');
    setEditingHall(null);
    setForm({ name: '', description: '', row_count: 10, col_count: 10 });
    setShowModal(true);
  };

  const openEdit = (hall: Hall) => {
    setError('');
    setEditingHall(hall);
    setForm({
      name: hall.name ?? '',
      description: hall.description ?? '',
      row_count: hall.row_count ?? 10,
      col_count: hall.col_count ?? 10,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Vui lòng nhập tên hội trường', 'error');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingHall) {
        await dataService.updateHall(editingHall.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          row_count: form.row_count,
          col_count: form.col_count,
        });
        showToast('Đã cập nhật hội trường thành công', 'success');
      } else {
        const newHall = await dataService.createHall({
          name: form.name.trim(),
          description: form.description.trim(),
          row_count: form.row_count,
          col_count: form.col_count,
        });

        const hallId = (newHall as Hall).id;
        const cellW = 40;
        const cellH = 40;
        const canvasW = 800;
        const canvasH = 600;
        const offsetX = Math.max(20, (canvasW - form.col_count * cellW) / 2);
        const offsetY = Math.max(20, (canvasH - form.row_count * cellH) / 2);
        const chairElements: any[] = [];

        for (let r = 0; r < form.row_count; r++) {
          for (let c = 0; c < form.col_count; c++) {
            const rowLabel = String.fromCharCode(65 + r);
            chairElements.push({
              hall_id: hallId,
              element_type: 'chair',
              x: offsetX + c * cellW,
              y: offsetY + r * cellH,
              width: 32,
              height: 32,
              rotation: 0,
              label: `${rowLabel}${c + 1}`,
              seat_type: 'delegate',
            });
          }
        }

        if (chairElements.length > 0) {
          await dataService.saveBatchElements(hallId, chairElements);
        }

        showToast('Đã tạo hội trường và sơ đồ ghế thành công', 'success');
      }

      setShowModal(false);
      await fetchHalls();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hall: Hall) => {
    const confirmed = await confirm({
      title: 'Xóa hội trường',
      message: `Xóa hội trường "${hall.name}"?\n\nTất cả phần tử sơ đồ và sự kiện liên quan có thể bị ảnh hưởng.`,
      danger: true,
      confirmText: 'Xóa',
    });
    if (!confirmed) return;

    setError('');
    try {
      await dataService.deleteHall(hall.id);
      showToast('Đã xóa hội trường thành công', 'success');
      await fetchHalls();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa hội trường';
      setError(message);
      showToast('Không thể xóa hội trường: ' + message, 'error');
    }
  };

  if (loading) return <LoadingSpinner label="Đang tải danh sách hội trường..." />;

  return (
    <div>
      <PageHeader
        title="Hội trường"
        subtitle="Quản lý các hội trường và thiết kế sơ đồ tự do"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={18} /> Thêm hội trường
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {halls.length === 0 ? (
        <EmptyState
          icon={<Building2 size={32} />}
          title="Chưa có hội trường"
          description="Tạo hội trường đầu tiên, sau đó thiết kế sơ đồ tự do với ghế, bàn, sân khấu..."
          action={
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={18} /> Thêm hội trường
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {halls.map((hall) => (
            <div
              key={hall.id}
              className="card p-5 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                  <Building2 size={24} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(hall)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-brand-600 transition-colors"
                    title="Sửa"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(hall)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">{hall.name}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                {hall.description || 'Không có mô tả'}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Armchair size={14} />
                  {hall.chair_count} ghế
                </span>
                <span className="flex items-center gap-1">
                  <Grid3x3 size={14} />
                  {hall.element_count} phần tử
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {hall.event_count} sự kiện
                </span>
              </div>

              <button
                onClick={() => onOpenDesigner(hall.id)}
                className="w-full btn-secondary justify-center"
              >
                <Grid3x3 size={16} /> Thiết kế sơ đồ
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { if (!saving) setShowModal(false); }}
        title={editingHall ? 'Chỉnh sửa hội trường' : 'Thêm hội trường mới'}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Tên hội trường *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Hội trường A - Bệnh viện"
              autoFocus
              disabled={saving}
            />
          </div>

          <div>
            <label className="label">Mô tả</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả ngắn về hội trường..."
              disabled={saving}
            />
          </div>

          {!editingHall && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Số hàng</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="input"
                  value={form.row_count}
                  disabled={saving}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 1;
                    setForm({ ...form, row_count: Math.max(1, Math.min(50, value)) });
                  }}
                />
              </div>
              <div>
                <label className="label">Số cột</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  className="input"
                  value={form.col_count}
                  disabled={saving}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 1;
                    setForm({ ...form, col_count: Math.max(1, Math.min(50, value)) });
                  }}
                />
              </div>
            </div>
          )}

          {!editingHall && (
            <p className="text-xs text-gray-400">
              Ghế sẽ được tự động tạo theo lưới {form.row_count} × {form.col_count} ({form.row_count * form.col_count} ghế). Sau đó bạn có thể thiết kế tự do thêm bàn, sân khấu, vách...
            </p>
          )}

          {error && <ErrorBanner message={error} />}

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
              Hủy
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

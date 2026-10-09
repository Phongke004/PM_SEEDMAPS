import { useState, useEffect, useCallback, useRef } from 'react';
import { type Hall, type HallElement } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { LoadingSpinner, ErrorBanner } from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import {
  ArrowLeft,
  Save,
  Trash2,
  Armchair,
  Table2,
  Mic2,
  DoorOpen,
  Minus,
  Square,
  RotateCw,
  Copy,
  MousePointer2,
  AlignCenterHorizontal,
  AlignCenterVertical,
  Grid3x3,
  GitBranch,
  Undo2,
  ArrowLeftRight,
} from 'lucide-react';

type SeatDesignerProps = {
  hallId: string;
  onBack: () => void;
};

type Tool = 'select' | 'chair' | 'table' | 'stage' | 'door' | 'wall' | 'zone';

const TOOLS: { id: Tool; label: string; icon: typeof Armchair; color: string }[] = [
  { id: 'select', label: 'Chọn', icon: MousePointer2, color: 'text-gray-600' },
  { id: 'chair', label: 'Ghế Đại biểu', icon: Armchair, color: 'text-brand-600' },
  { id: 'table', label: 'Bàn', icon: Table2, color: 'text-blue-600' },
  { id: 'stage', label: 'Sân khấu', icon: Mic2, color: 'text-purple-600' },
  { id: 'door', label: 'Cửa/Lối đi', icon: DoorOpen, color: 'text-amber-600' },
  { id: 'wall', label: 'Vách ngăn', icon: Minus, color: 'text-gray-500' },
  { id: 'zone', label: 'Khu vực', icon: Square, color: 'text-green-600' },
];

const ELEMENT_DEFAULTS: Record<string, { width: number; height: number; color: string; label: string }> = {
  chair: { width: 32, height: 32, color: 'bg-brand-100 border-brand-300 text-brand-700', label: 'Ghế' },
  table: { width: 120, height: 60, color: 'bg-blue-50 border-blue-300 text-blue-700', label: 'Bàn' },
  stage: { width: 300, height: 60, color: 'bg-purple-100 border-purple-300 text-purple-700', label: 'Sân khấu' },
  door: { width: 40, height: 8, color: 'bg-amber-200 border-amber-400 text-amber-700', label: 'Cửa' },
  wall: { width: 200, height: 6, color: 'bg-gray-300 border-gray-400 text-gray-600', label: 'Vách' },
  zone: { width: 200, height: 150, color: 'bg-green-50 border-green-300 border-dashed text-green-700', label: 'Khu vực' },
};

export function SeatDesignerPage({ hallId, onBack }: SeatDesignerProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [hall, setHall] = useState<Hall | null>(null);
  const [elements, setElements] = useState<HallElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tool, setTool] = useState<Tool>('select');
  const [seatType, setSeatType] = useState<'delegate' | 'guest'>('delegate');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<Partial<HallElement>[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Set<string>>(new Set());
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<HallElement>>>(new Map());
  const [dragInfo, setDragInfo] = useState<{ id: string; startX: number; startY: number; elemX: number; elemY: number; dragStarts: Map<string, { x: number; y: number }> } | null>(null);
  const [resizeInfo, setResizeInfo] = useState<{ id: string; startMX: number; startMY: number; startW: number; startH: number; startX: number; startY: number; type: 'both' | 'width' | 'height' | 'left' } | null>(null);
  const [rotateInfo, setRotateInfo] = useState<{ id: string; cx: number; cy: number; startAngle: number } | null>(null);
  const [zoneLabel, setZoneLabel] = useState('');

  const [marqueeInfo, setMarqueeInfo] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [dragGuides, setDragGuides] = useState<{ vertical: number[]; horizontal: number[] }>({ vertical: [], horizontal: [] });
  const canvasRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ pendingCreate: Partial<HallElement>[]; pendingDelete: Set<string>; pendingUpdates: Map<string, Partial<HallElement>>; elements: HallElement[] }[]>([]);
  const actionHistoryPushed = useRef(false);
  const [canUndo, setCanUndo] = useState(false);

  const pushHistory = () => {
    historyRef.current.push({
      pendingCreate: [...pendingCreate],
      pendingDelete: new Set(pendingDelete),
      pendingUpdates: new Map(pendingUpdates),
      elements: [...elements],
    });
    setCanUndo(true);
  };

  const undo = useCallback(() => {
    const snap = historyRef.current.pop();
    if (!snap) return;
    setPendingCreate(snap.pendingCreate);
    setPendingDelete(snap.pendingDelete);
    setPendingUpdates(snap.pendingUpdates);
    setElements(snap.elements);
    setSelectedIds(new Set());
    setCanUndo(historyRef.current.length > 0);
    setDirty(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  const fetchHall = useCallback(async () => {
    setLoading(true);
    try {
      const hallsData = await dataService.getHalls();
      const hallItem = hallsData.find((h) => h.id === hallId);
      const elemData = await dataService.getHallElements(hallId);

      if (!hallItem) {
        setError('Không tìm thấy hội trường');
        setLoading(false);
        return;
      }
      setHall(hallItem as Hall);
      setElements((elemData as HallElement[]) || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu hội trường');
      setLoading(false);
    }
  }, [hallId]);

  useEffect(() => {
    fetchHall();
  }, [fetchHall]);

  const innerCanvasRef = useRef<HTMLDivElement>(null);

  const getCanvasPos = (e: MouseEvent | React.MouseEvent): { x: number; y: number } => {
    const rect = innerCanvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tool !== 'select') return;
    const pos = getCanvasPos(e);
    setMarqueeInfo({ startX: pos.x, startY: pos.y, currentX: pos.x, currentY: pos.y });
    if (!e.shiftKey) setSelectedIds(new Set());
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'select') return;

    const pos = getCanvasPos(e);
    const defaults = ELEMENT_DEFAULTS[tool];
    const newElem: Partial<HallElement> = {
      id: crypto.randomUUID(),
      hall_id: hallId,
      element_type: tool,
      x: Math.round(pos.x - defaults.width / 2 + originX),
      y: Math.round(pos.y - defaults.height / 2 + originY),
      width: defaults.width,
      height: defaults.height,
      rotation: 0,
      label: tool === 'chair' ? '' : (tool === 'zone' && zoneLabel ? zoneLabel : defaults.label),
      seat_type: tool === 'chair' ? seatType : 'delegate',
    };
    pushHistory();
    setPendingCreate([...pendingCreate, newElem]);
    setDirty(true);
    setTool('select');
    if (tool === 'zone') setZoneLabel('');
  };

  const allElements: (HallElement | Partial<HallElement>)[] = [
    ...elements
      .filter((el) => !pendingDelete.has(el.id))
      .map((el) => {
        const updates = pendingUpdates.get(el.id);
        return updates ? { ...el, ...updates } : el;
      }),
    ...pendingCreate.map((el) => {
      const id = el.id as string;
      const updates = pendingUpdates.get(id);
      return updates ? { ...el, ...updates } : el;
    }),
  ];

  const elementBounds = allElements.reduce(
    (bounds, element) => {
      const left = element.x || 0;
      const top = element.y || 0;
      const width = element.width || 32;
      const height = element.height || 32;
      return {
        minX: Math.min(bounds.minX, left),
        minY: Math.min(bounds.minY, top),
        maxX: Math.max(bounds.maxX, left + width),
        maxY: Math.max(bounds.maxY, top + height),
      };
    },
    { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: 0, maxY: 0 },
  );
  const contentPadding = 48;
  const originX = Number.isFinite(elementBounds.minX) ? Math.max(0, elementBounds.minX - contentPadding) : 0;
  const originY = Number.isFinite(elementBounds.minY) ? Math.max(0, elementBounds.minY - contentPadding) : 0;
  const hasElements = allElements.length > 0;
  const canvasWidth = hasElements ? Math.max(300, elementBounds.maxX - originX + contentPadding) : 600;
  const canvasHeight = hasElements ? Math.max(250, elementBounds.maxY - originY + contentPadding) : 400;

  const getElem = (id: string): Partial<HallElement> | undefined => {
    const existing = elements.find((e) => e.id === id);
    if (existing) {
      const updates = pendingUpdates.get(id);
      return updates ? { ...existing, ...updates } : existing;
    }
    const pending = pendingCreate.find((e) => e.id === id);
    if (pending) {
      const updates = pendingUpdates.get(id);
      return updates ? { ...pending, ...updates } : pending;
    }
    return undefined;
  };

  const startDrag = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tool !== 'select') return;
    const elem = getElem(id);
    if (!elem) return;

    if (e.shiftKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }

    if (!selectedIds.has(id)) {
      setSelectedIds(new Set([id]));
    }

    const currentSelected = selectedIds.has(id) ? selectedIds : new Set([id]);
    const dragStarts = new Map<string, { x: number; y: number }>();
    for (const sid of currentSelected) {
      const el = getElem(sid);
      if (el) dragStarts.set(sid, { x: el.x || 0, y: el.y || 0 });
    }

    actionHistoryPushed.current = false;
    setDragInfo({ id, startX: e.clientX, startY: e.clientY, elemX: elem.x || 0, elemY: elem.y || 0, dragStarts });
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (dragInfo) {
        if (!actionHistoryPushed.current) {
          pushHistory();
          actionHistoryPushed.current = true;
        }
        const rawDx = e.clientX - dragInfo.startX;
        const rawDy = e.clientY - dragInfo.startY;
        let dx = rawDx;
        let dy = rawDy;

        // Compute guide lines for alignment
        const draggedElems = Array.from(dragInfo.dragStarts.entries()).map(([sid, start]) => ({
          id: sid,
          x: start.x + rawDx,
          y: start.y + rawDy,
          w: getElem(sid)?.width || 32,
          h: getElem(sid)?.height || 32,
        }));

        const otherElems = allElements.filter(e => !dragInfo.dragStarts.has(e.id as string));
        const snapThreshold = 6;
        const guides: { vertical: number[]; horizontal: number[] } = { vertical: [], horizontal: [] };

        for (const dragged of draggedElems) {
          const dCx = dragged.x + dragged.w / 2;
          const dCy = dragged.y + dragged.h / 2;
          for (const other of otherElems) {
            const oCx = (other.x || 0) + (other.width || 32) / 2;
            const oCy = (other.y || 0) + (other.height || 32) / 2;
            // Horizontal alignment (snap Y)
            if (Math.abs(dCy - oCy) < snapThreshold) {
              const snapDy = oCy - (dragInfo.dragStarts.get(dragged.id)?.y || 0) - (dragged.h / 2);
              if (Math.abs(snapDy) < Math.abs(dy)) dy = snapDy;
              guides.horizontal.push(oCy);
            }
            // Vertical alignment (snap X)
            if (Math.abs(dCx - oCx) < snapThreshold) {
              const snapDx = oCx - (dragInfo.dragStarts.get(dragged.id)?.x || 0) - (dragged.w / 2);
              if (Math.abs(snapDx) < Math.abs(dx)) dx = snapDx;
              guides.vertical.push(oCx);
            }
          }
        }
        setDragGuides(guides);

        setPendingUpdates((prev) => {
          const m = new Map(prev);
          for (const [sid, start] of dragInfo.dragStarts) {
            m.set(sid, { ...(m.get(sid) || {}), x: start.x + dx, y: start.y + dy });
          }
          return m;
        });
      } else if (resizeInfo) {
        if (!actionHistoryPushed.current) {
          pushHistory();
          actionHistoryPushed.current = true;
        }
        const dw = e.clientX - resizeInfo.startMX;
        const dh = e.clientY - resizeInfo.startMY;
        setPendingUpdates((prev) => {
          const m = new Map(prev);
          let newW = resizeInfo.startW;
          let newH = resizeInfo.startH;
          let newX = resizeInfo.startX;

          if (resizeInfo.type === 'width' || resizeInfo.type === 'both') {
            newW = Math.max(20, resizeInfo.startW + dw);
          }
          if (resizeInfo.type === 'height' || resizeInfo.type === 'both') {
            newH = Math.max(20, resizeInfo.startH + dh);
          }
          if (resizeInfo.type === 'left') {
            newW = Math.max(20, resizeInfo.startW - dw);
            const actualDw = resizeInfo.startW - newW;
            newX = resizeInfo.startX + actualDw;
          }

          m.set(resizeInfo.id, { ...(m.get(resizeInfo.id) || {}), width: newW, height: newH, x: newX });
          return m;
        });
      } else if (rotateInfo) {
        if (!actionHistoryPushed.current) {
          pushHistory();
          actionHistoryPushed.current = true;
        }
        const rect = innerCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.left + rotateInfo.cx;
        const cy = rect.top + rotateInfo.cy;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
        setPendingUpdates((prev) => {
          const m = new Map(prev);
          m.set(rotateInfo.id, { ...(m.get(rotateInfo.id) || {}), rotation: Math.round(angle) });
          return m;
        });
      } else if (marqueeInfo) {
        const rect = innerCanvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        setMarqueeInfo((prev) => prev ? {
          ...prev,
          currentX: e.clientX - rect.left,
          currentY: e.clientY - rect.top,
        } : null);
      }
    };
    const handleUp = () => {
      setDragGuides({ vertical: [], horizontal: [] });
      if (marqueeInfo) {
        const x1 = Math.min(marqueeInfo.startX, marqueeInfo.currentX);
        const y1 = Math.min(marqueeInfo.startY, marqueeInfo.currentY);
        const x2 = Math.max(marqueeInfo.startX, marqueeInfo.currentX);
        const y2 = Math.max(marqueeInfo.startY, marqueeInfo.currentY);
        if (x2 - x1 > 3 || y2 - y1 > 3) {
          setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const elem of allElements) {
              const ex = (elem.x || 0) - originX;
              const ey = (elem.y || 0) - originY;
              const ew = elem.width || 32;
              const eh = elem.height || 32;
              if (ex < x2 && ex + ew > x1 && ey < y2 && ey + eh > y1) {
                if (elem.id) next.add(elem.id as string);
              }
            }
            return next;
          });
        }
        setMarqueeInfo(null);
      }
      
      if ((dragInfo || resizeInfo || rotateInfo) && actionHistoryPushed.current) {
        setDirty(true);
      }

      setDragInfo(null);
      setResizeInfo(null);
      setRotateInfo(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragInfo, resizeInfo, rotateInfo, marqueeInfo, allElements, getElem]);

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    pushHistory();
    for (const id of selectedIds) {
      const isPending = pendingCreate.some((e) => e.id === id);
      if (isPending) {
        setPendingCreate((prev) => prev.filter((e) => e.id !== id));
      } else {
        setPendingDelete((prev) => new Set(prev).add(id));
      }
    }
    setSelectedIds(new Set());
    setDirty(true);
  };

  const applyUpdates = (updates: Map<string, Partial<HallElement>>) => {
    pushHistory();
    setPendingUpdates((prev) => {
      const m = new Map(prev);
      for (const [id, upd] of updates) {
        m.set(id, { ...(m.get(id) || {}), ...upd });
      }
      return m;
    });
    setDirty(true);
  };

  const alignHorizontal = () => {
    if (selectedIds.size < 2) return;
    const selected = Array.from(selectedIds).map(id => getElem(id)).filter(Boolean) as Partial<HallElement>[];
    const avgY = selected.reduce((sum, e) => sum + (e.y || 0), 0) / selected.length;
    const updates = new Map<string, Partial<HallElement>>();
    for (const e of selected) {
      if (e.id) updates.set(e.id as string, { y: Math.round(avgY) });
    }
    applyUpdates(updates);
  };

  const alignVertical = () => {
    if (selectedIds.size < 2) return;
    const selected = Array.from(selectedIds).map(id => getElem(id)).filter(Boolean) as Partial<HallElement>[];
    const avgX = selected.reduce((sum, e) => sum + (e.x || 0), 0) / selected.length;
    const updates = new Map<string, Partial<HallElement>>();
    for (const e of selected) {
      if (e.id) updates.set(e.id as string, { x: Math.round(avgX) });
    }
    applyUpdates(updates);
  };

  const alignGrid = () => {
    if (selectedIds.size < 2) return;
    const selected = Array.from(selectedIds).map(id => getElem(id)).filter(Boolean) as Partial<HallElement>[];
    const sorted = [...selected].sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
    const cellW = 40;
    const cellH = 40;
    const minX = Math.min(...sorted.map(e => e.x || 0));
    const minY = Math.min(...sorted.map(e => e.y || 0));
    const updates = new Map<string, Partial<HallElement>>();
    const cols = Math.ceil(Math.sqrt(sorted.length));
    sorted.forEach((e, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      if (e.id) updates.set(e.id as string, { x: minX + col * cellW, y: minY + row * cellH });
    });
    applyUpdates(updates);
  };

  const alignDiagonal = () => {
    if (selectedIds.size < 2) return;
    const selected = Array.from(selectedIds).map(id => getElem(id)).filter(Boolean) as Partial<HallElement>[];
    const sorted = [...selected].sort((a, b) => (a.x || 0) + (a.y || 0) - ((b.x || 0) + (b.y || 0)));
    const minX = Math.min(...sorted.map(e => e.x || 0));
    const minY = Math.min(...sorted.map(e => e.y || 0));
    const maxX = Math.max(...sorted.map(e => (e.x || 0) + (e.width || 32)));
    const maxY = Math.max(...sorted.map(e => (e.y || 0) + (e.height || 32)));
    const stepX = sorted.length > 1 ? (maxX - minX) / (sorted.length - 1) : 0;
    const stepY = sorted.length > 1 ? (maxY - minY) / (sorted.length - 1) : 0;
    const updates = new Map<string, Partial<HallElement>>();
    sorted.forEach((e, i) => {
      if (e.id) updates.set(e.id as string, { x: Math.round(minX + i * stepX), y: Math.round(minY + i * stepY) });
    });
    applyUpdates(updates);
  };

  const handleDuplicate = () => {
    if (selectedIds.size === 0) return;
    pushHistory();
    const copies: Partial<HallElement>[] = [];
    for (const id of selectedIds) {
      const elem = getElem(id);
      if (elem) {
        copies.push({ ...elem, id: crypto.randomUUID(), x: (elem.x || 0) + 20, y: (elem.y || 0) + 20 });
      }
    }
    setPendingCreate([...pendingCreate, ...copies]);
    setDirty(true);
  };

  const handleRotate = (id: string) => {
    const elem = getElem(id);
    if (!elem) return;
    actionHistoryPushed.current = false;
    const cx = (elem.x || 0) - originX + (elem.width || 0) / 2;
    const cy = (elem.y || 0) - originY + (elem.height || 0) / 2;
    setRotateInfo({ id, cx, cy, startAngle: elem.rotation || 0 });
  };

  const toggleSeatType = () => {
    const chairIds = Array.from(selectedIds).filter(id => {
      const elem = getElem(id);
      return elem?.element_type === 'chair';
    });
    if (chairIds.length === 0) return;
    const updates = new Map<string, Partial<HallElement>>();
    for (const id of chairIds) {
      const elem = getElem(id);
      const currentType = elem?.seat_type || 'delegate';
      updates.set(id, { seat_type: currentType === 'delegate' ? 'guest' : 'delegate' });
    }
    applyUpdates(updates);
  };

  const changeElementType = (newType: string) => {
    if (selectedIds.size === 0) return;
    const updates = new Map<string, Partial<HallElement>>();
    const defaults = ELEMENT_DEFAULTS[newType];
    for (const id of selectedIds) {
      updates.set(id, {
        element_type: newType as any,
        width: defaults.width,
        height: defaults.height,
        label: newType === 'chair' ? '' : defaults.label,
        seat_type: newType === 'chair' ? 'delegate' : 'delegate',
      });
    }
    applyUpdates(updates);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      await dataService.saveBatchElements(hallId, allElements);

      setPendingCreate([]);
      setPendingDelete(new Set());
      setPendingUpdates(new Map());
      setDirty(false);
      historyRef.current = [];
      setCanUndo(false);
      showToast('Đã lưu thiết kế sơ đồ thành công', 'success');
      await fetchHall();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu');
      showToast('Lỗi khi lưu sơ đồ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = async () => {
    const confirmed = await confirm({
      title: 'Xóa toàn bộ sơ đồ',
      message: 'Xóa toàn bộ sơ đồ? Mọi phần tử sẽ bị xóa.',
      danger: true,
      confirmText: 'Xóa',
    });
    if (!confirmed) return;
    pushHistory();
    setSaving(true);
    await dataService.saveBatchElements(hallId, []);
    setElements([]);
    setPendingCreate([]);
    setPendingDelete(new Set());
    setPendingUpdates(new Map());
    setDirty(false);
    setSaving(false);
    showToast('Đã xóa toàn bộ sơ đồ', 'success');
  };

  if (loading) return <LoadingSpinner label="Đang tải sơ đồ..." />;
  if (!hall) return <ErrorBanner message="Không tìm thấy hội trường" />;

  const chairCount = allElements.filter((e) => e.element_type === 'chair').length;
  const delegateCount = allElements.filter((e) => e.element_type === 'chair' && (e.seat_type === 'delegate' || (!e.seat_type && seatType === 'delegate'))).length;
  const guestCount = allElements.filter((e) => e.element_type === 'chair' && e.seat_type === 'guest').length;

  const renderElement = (elem: Partial<HallElement>, idx: number) => {
    const id = (elem.id as string) || `pending-${idx}`;
    const isSelected = selectedIds.has(id);
    const defaults = ELEMENT_DEFAULTS[elem.element_type || 'chair'];
    const isChair = elem.element_type === 'chair';
    const chairColor = elem.seat_type === 'guest'
      ? 'bg-amber-100 border-amber-300 text-amber-700'
      : 'bg-brand-100 border-brand-300 text-brand-700';
    const colorClass = isChair ? chairColor : defaults.color;

    return (
      <div
        key={id}
        onMouseDown={(e) => startDrag(e, id)}
        onClick={(e) => {
          e.stopPropagation();
          if (tool === 'select') {
            if (e.shiftKey) {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            } else {
              setSelectedIds(new Set([id]));
            }
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (tool === 'select' && isChair) {
            const currentType = elem.seat_type || 'delegate';
            applyUpdates(new Map([[id, { seat_type: currentType === 'delegate' ? 'guest' : 'delegate' }]]));
          }
        }}
        onContextMenu={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (tool === 'select') {
            if (!selectedIds.has(id)) setSelectedIds(new Set([id]));
          }
        }}
        className={`absolute cursor-move select-none flex items-center justify-center rounded-md border-2 transition-shadow ${colorClass} ${isSelected ? 'ring-2 ring-brand-500 ring-offset-1 shadow-lg' : 'hover:shadow-md'} ${elem.element_type === 'zone' ? 'border-dashed' : ''}`}
        style={{
          left: (elem.x || 0) - originX,
          top: (elem.y || 0) - originY,
          width: elem.width || 32,
          height: elem.height || 32,
          transform: `rotate(${elem.rotation || 0}deg)`,
          zIndex: isSelected ? 20 : (elem.element_type === 'zone' ? 0 : 10),
        }}
        title={elem.label || defaults.label}
      >
        {isChair && <Armchair size={16} />}
        {elem.element_type === 'table' && <Table2 size={20} />}
        {elem.element_type === 'stage' && <Mic2 size={20} />}
        {elem.element_type === 'door' && <DoorOpen size={16} />}
        {elem.element_type === 'wall' && <Minus size={16} />}
        {elem.element_type === 'zone' && elem.label && (
          <span className="text-xs font-medium px-2 text-center truncate">{elem.label}</span>
        )}

        {/* Resize handle */}
        {isSelected && tool === 'select' && (
          <>
            {/* Left handle (Left Width) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                actionHistoryPushed.current = false;
                setResizeInfo({ id, startMX: e.clientX, startMY: e.clientY, startW: elem.width || 32, startH: elem.height || 32, startX: elem.x || 0, startY: elem.y || 0, type: 'left' });
              }}
              className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-brand-500 border-2 border-white cursor-w-resize"
            />
            {/* Right handle (Width) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                actionHistoryPushed.current = false;
                setResizeInfo({ id, startMX: e.clientX, startMY: e.clientY, startW: elem.width || 32, startH: elem.height || 32, startX: elem.x || 0, startY: elem.y || 0, type: 'width' });
              }}
              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full bg-brand-500 border-2 border-white cursor-e-resize"
            />
            {/* Bottom handle (Height) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                actionHistoryPushed.current = false;
                setResizeInfo({ id, startMX: e.clientX, startMY: e.clientY, startW: elem.width || 32, startH: elem.height || 32, startX: elem.x || 0, startY: elem.y || 0, type: 'height' });
              }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-500 border-2 border-white cursor-s-resize"
            />
            {/* Corner handle (Both) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                actionHistoryPushed.current = false;
                setResizeInfo({ id, startMX: e.clientX, startMY: e.clientY, startW: elem.width || 32, startH: elem.height || 32, startX: elem.x || 0, startY: elem.y || 0, type: 'both' });
              }}
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-brand-500 border-2 border-white cursor-se-resize"
            />
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                handleRotate(id);
              }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center cursor-pointer"
            >
              <RotateCw size={10} className="text-brand-500" />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn-ghost" title="Quay lại">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{hall.name}</h1>
            <p className="text-sm text-gray-500">Thiết kế sơ đồ tự do</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={undo} disabled={!canUndo} title="Ctrl+Z">
            <Undo2 size={16} /> Hoàn tác
          </button>
          <button className="btn-secondary" onClick={handleClearAll} disabled={saving || allElements.length === 0}>
            <Trash2 size={16} /> Xóa hết
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!dirty || saving}>
            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Toolbar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Công cụ</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {TOOLS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border transition-all ${tool === t.id ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200' : 'border-gray-200 hover:bg-gray-50'}`}
                    title={t.label}
                  >
                    <Icon size={18} className={t.color} />
                    <span className="text-[10px] text-gray-600 leading-tight text-center">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seat type selector */}
          {tool === 'chair' && (
            <div className="card p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Loại ghế</h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSeatType('delegate')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${seatType === 'delegate' ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="w-5 h-5 rounded border-2 bg-brand-100 border-brand-300" />
                  <span className="text-sm text-gray-700">Ghế Đại biểu</span>
                </button>
                <button
                  onClick={() => setSeatType('guest')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${seatType === 'guest' ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="w-5 h-5 rounded border-2 bg-amber-100 border-amber-300" />
                  <span className="text-sm text-gray-700">Ghế Khách mời</span>
                </button>
              </div>
            </div>
          )}

          {/* Zone label input */}
          {tool === 'zone' && (
            <div className="card p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tên khu vực</h3>
              <input
                className="input text-sm"
                placeholder="VD: Khu A, Khu VIP..."
                value={zoneLabel}
                onChange={(e) => setZoneLabel(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">Nhập tên rồi nhấn vào canvas</p>
            </div>
          )}

          {/* Actions */}
          {tool === 'select' && selectedIds.size > 0 && (
            <div className="card p-3 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Đã chọn {selectedIds.size}</h3>
              {/* Change element type */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Đổi loại phần tử:</p>
                <div className="grid grid-cols-3 gap-1">
                  {TOOLS.filter(t => t.id !== 'select').map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => changeElementType(t.id)}
                        className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-[9px] text-gray-600"
                        title={`Đổi thành ${t.label}`}
                      >
                        <Icon size={14} className={t.color} />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {(() => {
                const selectedChairs = Array.from(selectedIds).filter(id => getElem(id)?.element_type === 'chair');
                if (selectedChairs.length === 0) return null;
                const allDelegate = selectedChairs.every(id => (getElem(id)?.seat_type || 'delegate') === 'delegate');
                return (
                  <button onClick={toggleSeatType} className="w-full btn-secondary justify-center text-sm">
                    <ArrowLeftRight size={14} /> {allDelegate ? 'Chuyển sang Khách mời' : 'Chuyển sang Đại biểu'}
                  </button>
                );
              })()}
              {selectedIds.size >= 2 && (
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={alignHorizontal} className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-xs text-gray-600">
                    <AlignCenterHorizontal size={16} className="text-brand-600" />
                    Hàng ngang
                  </button>
                  <button onClick={alignVertical} className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-xs text-gray-600">
                    <AlignCenterVertical size={16} className="text-brand-600" />
                    Cột dọc
                  </button>
                  <button onClick={alignDiagonal} className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-xs text-gray-600">
                    <GitBranch size={16} className="text-brand-600" />
                    Hàng chéo
                  </button>
                  <button onClick={alignGrid} className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-xs text-gray-600">
                    <Grid3x3 size={16} className="text-brand-600" />
                    Gióng lưới
                  </button>
                </div>
              )}
              <button onClick={handleDuplicate} className="w-full btn-secondary justify-center text-sm">
                <Copy size={14} /> Nhân bản
              </button>
              <button onClick={handleDelete} className="w-full btn-danger justify-center text-sm">
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="card p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Thống kê</h3>
            <div className="text-sm space-y-1 text-gray-600">
              <div className="flex justify-between"><span>Tổng ghế:</span><span className="font-semibold">{chairCount}</span></div>
              <div className="flex justify-between"><span>Đại biểu:</span><span className="font-semibold text-brand-600">{delegateCount}</span></div>
              <div className="flex justify-between"><span>Khách mời:</span><span className="font-semibold text-amber-600">{guestCount}</span></div>
              <div className="flex justify-between"><span>Bàn:</span><span className="font-semibold">{allElements.filter((e) => e.element_type === 'table').length}</span></div>
            </div>
          </div>

          {/* Legend */}
          <div className="card p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Chú thích</h3>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded border-2 bg-brand-100 border-brand-300" /> Đại biểu</div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded border-2 bg-amber-100 border-amber-300" /> Khách mời</div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded border-2 bg-blue-50 border-blue-300" /> Bàn</div>
              <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded border-2 bg-purple-100 border-purple-300" /> Sân khấu</div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-4 flex flex-col">
          <div
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onClick={handleCanvasClick}
            className="card print-seat-map relative overflow-auto bg-gray-50 flex items-center justify-center p-6 min-h-[450px]"
            style={{
              backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              cursor: tool === 'select' ? 'default' : 'crosshair',
            }}
          >
            {/* Grid background */}
            <div
              ref={innerCanvasRef}
              className="relative shrink-0 transition-all duration-150"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              {allElements.map((elem, idx) => renderElement(elem, idx))}
              {dragGuides.vertical.map((x, i) => (
                <div key={`gv-${i}`} className="absolute pointer-events-none z-40" style={{ left: x - originX, top: 0, bottom: 0, width: '1px', background: '#ef4444', opacity: 0.5 }} />
              ))}
              {dragGuides.horizontal.map((y, i) => (
                <div key={`gh-${i}`} className="absolute pointer-events-none z-40" style={{ left: 0, right: 0, top: y - originY, height: '1px', background: '#ef4444', opacity: 0.5 }} />
              ))}
              {marqueeInfo && (
                <div
                  className="absolute border-2 border-brand-400 bg-brand-200/20 pointer-events-none z-30 rounded"
                  style={{
                    left: Math.min(marqueeInfo.startX, marqueeInfo.currentX),
                    top: Math.min(marqueeInfo.startY, marqueeInfo.currentY),
                    width: Math.abs(marqueeInfo.currentX - marqueeInfo.startX),
                    height: Math.abs(marqueeInfo.currentY - marqueeInfo.startY),
                  }}
                />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {tool === 'select'
              ? 'Kéo chuột trên vùng trống để chọn nhiều · Kéo phần tử để di chuyển · Double-click ghế để đổi loại · Click phải để chọn · Ctrl+Z để hoàn tác'
              : `Nhấn vào canvas để thêm ${TOOLS.find((t) => t.id === tool)?.label.toLowerCase()}`}
          </p>
        </div>
      </div>

    </div>
  );
}


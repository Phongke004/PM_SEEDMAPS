import { useState, useEffect, useCallback, useRef } from 'react';
import { type Hall, type AppEvent, type HallElement, type Attendee, type Assignment } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { SecureStorage } from '@/utils/storage';
import { PageHeader, LoadingSpinner, ErrorBanner } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import {
  Armchair,
  UserPlus,
  Wand2,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Users,
  Table2,
  Mic2,
  DoorOpen,
  Minus,
  Square,
  Info,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/Confirm';
import { checkPermission } from '@/utils/permissions';

type AssignmentWithAttendee = Assignment & {
  attendee: Attendee | null;
};

const ELEMENT_ICONS: Record<string, typeof Armchair> = {
  chair: Armchair,
  table: Table2,
  stage: Mic2,
  door: DoorOpen,
  wall: Minus,
  zone: Square,
};

const ELEMENT_COLORS: Record<string, string> = {
  chair: 'bg-brand-100 border-brand-300 text-brand-700',
  table: 'bg-blue-50 border-blue-300 text-blue-700',
  stage: 'bg-purple-100 border-purple-300 text-purple-700',
  door: 'bg-amber-200 border-amber-400 text-amber-700',
  wall: 'bg-gray-300 border-gray-400 text-gray-600',
  zone: 'bg-green-50 border-green-300 border-dashed text-green-700',
};

export function AssignmentPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const canEdit = checkPermission('EVENT_EDIT');
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [hall, setHall] = useState<Hall | null>(null);
  const [elements, setElements] = useState<HallElement[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [assignments, setAssignments] = useState<Map<string, AssignmentWithAttendee>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<string | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [detailElement, setDetailElement] = useState<HallElement | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    const data = await dataService.getEvents();
    const eventsData = data || [];
    setEvents(eventsData);
    if (eventsData.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsData[0].id);
    }
  }, [selectedEventId]);

  const fetchData = useCallback(async () => {
    if (!selectedEventId) {
      setElements([]);
      setAttendees([]);
      setAssignments(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const evtData = events.find(e => e.id === selectedEventId);
    if (!evtData) {
      setLoading(false);
      return;
    }

    const halls = await dataService.getHalls();
    const hallData = halls.find(h => h.id === evtData.hall_id);
    setHall((hallData as Hall) || null);

    const elemData = await dataService.getHallElements(evtData.hall_id);
    setElements(elemData || []);

    const attendeesData = await dataService.getAttendees(selectedEventId);
    setAttendees(attendeesData || []);

    const assigns = await dataService.getAssignments(selectedEventId);

    const assignMap = new Map<string, AssignmentWithAttendee>();
    for (const a of assigns) {
      const att = attendeesData.find((at) => at.id === a.attendee_id) || null;
      assignMap.set(a.element_id, { ...a, attendee: att });
    }
    setAssignments(assignMap);
    setLoading(false);
  }, [selectedEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [mapScale, setMapScale] = useState(1);

  const elementBounds = elements.reduce(
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
  const contentPadding = 32;
  const originX = Number.isFinite(elementBounds.minX) ? elementBounds.minX - contentPadding : 0;
  const originY = Number.isFinite(elementBounds.minY) ? elementBounds.minY - contentPadding : 0;
  const hasElements = elements.length > 0;
  const maxX = hasElements ? elementBounds.maxX - originX + contentPadding : 800;
  const maxY = hasElements ? elementBounds.maxY - originY + contentPadding : 500;

  useEffect(() => {
    const fitMap = () => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const padding = 32;
      const availableWidth = rect.width - padding;
      const availableHeight = rect.height > 0 ? rect.height - padding : 500;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      const sx = availableWidth / maxX;
      const sy = availableHeight / maxY;
      const readableScale = Math.min(sx, sy, 2.0);
      setMapScale(Math.max(readableScale, 0.7));
    };
    fitMap();

    const el = canvasRef.current;
    let observer: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => fitMap());
      observer.observe(el);
    }
    window.addEventListener('resize', fitMap);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', fitMap);
    };
  }, [maxX, maxY, elements]);

  const chairElements = elements.filter((e) => e.element_type === 'chair');

  const assignAttendee = async (elementId: string, attendeeId: string) => {
    if (!canEdit) return;
    setAssigning(true);
    const existing = assignments.get(elementId);

    try {
      const assignment = await dataService.assignSeat(selectedEventId, elementId, attendeeId);
      const att = attendees.find((a) => a.id === attendeeId) || null;
      setAssignments(new Map(assignments).set(elementId, { ...(assignment as any), attendee: att }));

      setAttendees((prev) => prev.map((a) => (a.id === attendeeId ? { ...a, status: 'assigned' } : a)));
      setSelectedAttendeeId(null);
      setAssigning(false);
      showToast('Đã bố trí chỗ ngồi thành công', 'success');
    } catch (err: any) {
      setError(err.message);
      setAssigning(false);
    }
  };

  const unassignElement = async (elementId: string) => {
    if (!canEdit) return;
    const existing = assignments.get(elementId);
    if (!existing) return;

    setAssigning(true);
    try {
      await dataService.unassignSeat(selectedEventId, elementId);
      if (existing.attendee_id) {
        setAttendees((prev) => prev.map((a) => (a.id === existing.attendee_id ? { ...a, status: 'pending' } : a)));
      }
      const newMap = new Map(assignments);
      newMap.delete(elementId);
      setAssignments(newMap);
      showToast('Đã hủy bố trí chỗ ngồi', 'info');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleElementClick = (elem: HallElement) => {
    if (elem.element_type !== 'chair') {
      setDetailElement(elem);
      return;
    }
    if (assigning) return;

    const existing = assignments.get(elem.id);
    if (existing) {
      unassignElement(elem.id);
    } else if (selectedAttendeeId) {
      assignAttendee(elem.id, selectedAttendeeId);
    } else {
      setDetailElement(elem);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedEventId) return;
    const confirmed = await confirm({
      title: 'Tự động bố trí',
      message: 'Tự động bố trí chỗ ngồi cho tất cả người chưa được bố trí?',
      confirmText: 'Bố trí',
      danger: false,
    });
    if (!confirmed) return;

    setAssigning(true);
    setError('');

    const unassignedAttendees = attendees.filter((a) => a.status === 'pending');
    const availableChairs = chairElements.filter((c) => !assignments.has(c.id));

    const count = Math.min(unassignedAttendees.length, availableChairs.length);
    if (count === 0) {
      setError('Không có người cần bố trí hoặc không còn chỗ trống.');
      setAssigning(false);
      return;
    }

    try {
      const res = await dataService.autoAssign(selectedEventId, 'alphabetical');
      showToast(res?.message || `Đã tự động bố trí người vào chỗ ngồi`, 'success');
      // Reload everything
      fetchData();
    } catch (err: any) {
      setError(err.message);
      setAssigning(false);
    }
  };

  const handleClearAll = async () => {
    if (!selectedEventId) return;
    const confirmed = await confirm({
      title: 'Xóa bố trí chỗ ngồi',
      message: 'Xóa toàn bộ bố trí chỗ ngồi cho sự kiện này?',
      danger: true,
      confirmText: 'Xóa',
    });
    if (!confirmed) return;

    setAssigning(true);
    try {
      // Create a function in dataService or API to clear all?
      // Since it's not explicitly in dataService, we'll use a hack or implement it.
      // Actually we have it in backend! I should add clearAllAssignments to dataService!
      // But for now let's just make direct request for C# or supabase
      if (import.meta.env.VITE_API_URL || 'https://localhost:7220/api') {
         await fetch(`${import.meta.env.VITE_API_URL || 'https://localhost:7220/api'}/events/${selectedEventId}/assignments`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${SecureStorage.getItem<string>('token')}` }
         });
      }
      
      setAttendees((prev) => prev.map((a) => ({ ...a, status: 'pending' })));
      setAssignments(new Map());
      showToast('Đã xóa toàn bộ bố trí chỗ ngồi', 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const filteredAttendees = attendees.filter((a) => {
    const q = search.toLowerCase();
    const assignedElem = Array.from(assignments.values()).find((asg) => asg.attendee_id === a.id);
    const elemLabel = assignedElem ? elements.find((e) => e.id === assignedElem.element_id)?.label || '' : '';
    return (
      a.full_name.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q) ||
      (assignedElem?.element_id || '').toLowerCase().includes(q) ||
      elemLabel.toLowerCase().includes(q)
    );
  });

  const assignedCount = Array.from(assignments.values()).filter((a) => a.attendee_id).length;
  const pendingAttendees = attendees.filter((a) => a.status === 'pending');
  const availableChairsCount = chairElements.filter((c) => !assignments.has(c.id)).length;

  if (loading && events.length === 0) return <LoadingSpinner label="Đang tải..." />;

  return (
    <div>
      <PageHeader
        title="Bố trí chỗ ngồi"
        subtitle="Gán người tham dự vào chỗ ngồi trên sơ đồ"
        actions={
          canEdit ? (
            <>
              <button className="btn-secondary" onClick={handleClearAll} disabled={!selectedEventId || assignments.size === 0 || assigning}>
                <Trash2 size={16} /> Xóa tất cả
              </button>
              <button className="btn-primary" onClick={handleAutoAssign} disabled={!selectedEventId || assigning || pendingAttendees.length === 0}>
                <Wand2 size={18} /> Tự động bố trí
              </button>
            </>
          ) : null
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="mb-4">
        <select
          className="input sm:max-w-md"
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
      </div>

      {!selectedEventId ? (
        <EmptyState
          icon={<Armchair size={32} />}
          title="Chọn sự kiện"
          description="Vui lòng chọn một sự kiện để bắt đầu bố trí chỗ ngồi"
        />
      ) : loading ? (
        <LoadingSpinner label="Đang tải sơ đồ..." />
      ) : !hall ? (
        <ErrorBanner message="Không tìm thấy hội trường" />
      ) : elements.length === 0 ? (
        <EmptyState
          icon={<Armchair size={32} />}
          title="Chưa có sơ đồ"
          description="Hội trường này chưa được thiết kế sơ đồ. Vui lòng thiết kế sơ đồ trước."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                <span className="flex items-center gap-1.5 text-brand-600 font-medium">
                  <CheckCircle2 size={16} /> {assignedCount} đã bố trí
                </span>
                <span className="text-gray-500">{availableChairsCount} ghế trống</span>
                <span className="text-gray-500">{pendingAttendees.length} người chờ</span>
              </div>

              {/* Free-form canvas */}
              <div
                ref={canvasRef}
                className="relative flex items-center justify-center overflow-auto bg-gray-50 rounded-lg border border-gray-200 p-4"
                style={{
                  minHeight: '500px',
                  backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                <div
                  className="relative shrink-0"
                  style={{
                    width: maxX * mapScale,
                    height: maxY * mapScale,
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      width: maxX,
                      height: maxY,
                      transform: `scale(${mapScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    {elements.map((elem) => {
                      const Icon = ELEMENT_ICONS[elem.element_type] || Armchair;
                      const colorClass = elem.element_type === 'chair'
                        ? (elem.seat_type === 'guest'
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'bg-brand-100 border-brand-300 text-brand-700')
                        : (ELEMENT_COLORS[elem.element_type] || ELEMENT_COLORS.chair);
                      const assignment = assignments.get(elem.id);
                      const isHovered = hoveredElement === elem.id;
                      const isChair = elem.element_type === 'chair';
                      const showHighlight = selectedAttendeeId && !assignment && isChair;
                      const assignedAttendee = assignment?.attendee;

                      return (
                        <button
                          key={elem.id}
                          onClick={() => handleElementClick(elem)}
                          onMouseEnter={() => setHoveredElement(elem.id)}
                          onMouseLeave={() => setHoveredElement(null)}
                          className={`absolute flex flex-col items-center justify-center rounded-md border-2 transition-all duration-150 overflow-hidden ${colorClass} ${elem.element_type === 'zone' ? 'border-dashed' : ''} ${isChair ? 'cursor-pointer' : 'cursor-pointer'} ${showHighlight ? 'ring-2 ring-brand-400 ring-offset-1 animate-pulse' : ''} ${isHovered ? 'scale-105 shadow-md z-10' : ''} ${assignedAttendee ? 'ring-1 ring-brand-400' : ''}`}
                          style={{
                            left: (elem.x || 0) - originX,
                            top: (elem.y || 0) - originY,
                            width: elem.width,
                            height: elem.height,
                            transform: `rotate(${elem.rotation}deg)`,
                          }}
                          title={
                            isChair
                              ? assignedAttendee
                                ? `${elem.label || 'Ghế'}: ${assignedAttendee.title ? assignedAttendee.title + ' ' : ''}${assignedAttendee.full_name}${elem.seat_type === 'guest' ? (assignedAttendee.department ? ' - ' + assignedAttendee.department : '') : (assignedAttendee.position || assignedAttendee.degree ? ' - ' + (assignedAttendee.position || assignedAttendee.degree) : '')}`
                                : `${elem.label || 'Ghế'}: Trống`
                              : elem.label || elem.element_type
                          }
                        >
                          {isChair ? (
                            assignedAttendee ? (
                              <div className="flex flex-col items-center justify-center w-full h-full px-0.5 leading-[8px] overflow-hidden">
                                <span className="text-[7px] font-semibold text-center truncate w-full">
                                  {assignedAttendee.title ? assignedAttendee.title + ' ' : ''}{assignedAttendee.full_name}
                                </span>
                                <span className="text-[6px] text-center truncate w-full opacity-80">
                                  {elem.seat_type === 'guest'
                                    ? assignedAttendee.department || ''
                                    : assignedAttendee.position || assignedAttendee.degree || ''}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <Armchair size={14} />
                              </div>
                            )
                          ) : (
                            <Icon size={elem.element_type === 'wall' ? 16 : 20} />
                          )}
                          {elem.element_type === 'zone' && elem.label && (
                            <span className="text-xs font-medium px-2 text-center truncate absolute inset-0 flex items-center justify-center">
                              {elem.label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-4 h-4 rounded border-2 bg-brand-100 border-brand-300" /> Ghế Đại biểu
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-4 h-4 rounded border-2 bg-amber-100 border-amber-300" /> Ghế Khách mời
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-4 h-4 rounded border-2 bg-blue-50 border-blue-300" /> Bàn
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-4 h-4 rounded border-2 bg-purple-100 border-purple-300" /> Sân khấu
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-4 h-4 rounded-full bg-brand-500 border-2 border-white" /> Đã bố trí
                </div>
              </div>

              {selectedAttendeeId && (
                <div className="mt-4 rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-brand-700">
                    <UserPlus size={16} />
                    <span>
                      Đang chọn: <strong>{attendees.find((a) => a.id === selectedAttendeeId)?.full_name}</strong>
                      {' '}— nhấn vào một ghế trống để bố trí
                    </span>
                  </div>
                  <button onClick={() => setSelectedAttendeeId(null)} className="p-1 rounded text-brand-600 hover:bg-brand-100">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Attendee panel */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={18} /> Danh sách người tham dự
                </h3>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9 text-sm"
                    placeholder="Tìm theo tên, đơn vị, mã ghế..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {filteredAttendees.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-400">
                    {attendees.length === 0 ? 'Chưa có người tham dự' : 'Không tìm thấy'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAttendees.map((att) => {
                      const isAssigned = att.status === 'assigned';
                      const isSelected = selectedAttendeeId === att.id;
                      const assignedElem = Array.from(assignments.values()).find((a) => a.attendee_id === att.id);
                      const elemLabel = assignedElem ? elements.find((e) => e.id === assignedElem.element_id)?.label : null;

                      return (
                        <button
                          key={att.id}
                          onClick={() => {
                            if (isAssigned) return;
                            setSelectedAttendeeId(isSelected ? null : att.id);
                          }}
                          disabled={isAssigned}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${isSelected ? 'bg-brand-100 ring-2 ring-brand-400' : ''} ${isAssigned ? 'bg-gray-50 opacity-60 cursor-default' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {att.title ? att.title + ' ' : ''}{att.full_name}
                              </div>
                              {att.position && (
                                <div className="text-xs text-gray-400 truncate">{att.position}</div>
                              )}
                              {att.department && (
                                <div className="text-xs text-gray-400 truncate">{att.department}</div>
                              )}
                              {isAssigned && elemLabel && (
                                <div className="text-xs text-brand-600 truncate mt-0.5">
                                  Ghế: {elemLabel}
                                </div>
                              )}
                            </div>
                            {isAssigned ? (
                              <span className="badge bg-brand-100 text-brand-700 flex-shrink-0">
                                <CheckCircle2 size={12} className="mr-1" /> Đã bố trí
                              </span>
                            ) : isSelected ? (
                              <span className="badge bg-brand-600 text-white flex-shrink-0">Đã chọn</span>
                            ) : (
                              <span className="badge bg-gray-100 text-gray-500 flex-shrink-0">Chờ</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedAttendeeId && (
                <div className="p-3 border-t border-gray-200 bg-brand-50">
                  <p className="text-xs text-brand-700 text-center">
                    Nhấn vào ghế trống trên sơ đồ để bố trí
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Element detail modal */}
      {detailElement && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetailElement(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Info size={18} className="text-brand-500" />
                Thông tin phần tử
              </h3>
              <button onClick={() => setDetailElement(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div><span className="font-medium text-gray-800">Loại:</span> {detailElement.element_type}</div>
              <div><span className="font-medium text-gray-800">Nhãn:</span> {detailElement.label || '(không có)'}</div>
              {detailElement.element_type === 'chair' && (
                <>
                  <div><span className="font-medium text-gray-800">Loại ghế:</span> {detailElement.seat_type === 'guest' ? 'Khách mời' : 'Đại biểu'}</div>
                  <div>
                    <span className="font-medium text-gray-800">Trạng thái:</span>{' '}
                    {assignments.get(detailElement.id)?.attendee ? (
                      <span className="text-brand-600">Đã bố trí</span>
                    ) : (
                      <span className="text-gray-500">Trống</span>
                    )}
                  </div>
                  {(() => {
                    const att = assignments.get(detailElement.id)?.attendee;
                    if (!att) return null;
                    return (
                      <div className="mt-3 p-3 rounded-lg bg-brand-50 border border-brand-100 space-y-1">
                        <div className="font-semibold text-gray-900">
                          {att.title ? att.title + ' ' : ''}{att.full_name}
                        </div>
                        {detailElement.seat_type === 'guest' ? (
                          att.department && <div className="text-xs text-gray-600">Khoa/Phòng: {att.department}</div>
                        ) : (
                          <>
                            {att.position && <div className="text-xs text-gray-600">Chức vụ: {att.position}</div>}
                            {att.degree && <div className="text-xs text-gray-600">Học vị: {att.degree}</div>}
                          </>
                        )}
                        {att.phone && <div className="text-xs text-gray-500">SĐT: {att.phone}</div>}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            {canEdit && detailElement.element_type === 'chair' && assignments.get(detailElement.id) && (
              <button
                onClick={() => {
                  unassignElement(detailElement.id);
                  setDetailElement(null);
                }}
                className="w-full btn-danger justify-center mt-4 text-sm"
                disabled={assigning}
              >
                <Trash2 size={14} /> Hủy bố trí
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

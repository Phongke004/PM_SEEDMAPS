import { useState, useEffect, useRef } from 'react';
import { type Hall, type HallElement, type AppEvent, type Attendee, type Assignment } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { LoadingSpinner } from '@/components/PageHeader';
import {
  Monitor,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Armchair,
  Table2,
  Mic2,
  DoorOpen,
  Minus,
  Building2,
  CalendarDays,
} from 'lucide-react';

export function PresentationPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHallId, setSelectedHallId] = useState('');
  const [hall, setHall] = useState<Hall | null>(null);
  const [elements, setElements] = useState<HallElement[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [assignments, setAssignments] = useState<Map<string, Attendee>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [baseScale, setBaseScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHalls = async () => {
      const data = await dataService.getHalls();
      setHalls(data || []);
      setLoading(false);
    };
    fetchHalls();
  }, []);

  useEffect(() => {
    if (!selectedHallId) {
      setHall(null);
      setElements([]);
      setEvents([]);
      setSelectedEventId('');
      setAssignments(new Map());
      return;
    }
    const fetchHall = async () => {
      setLoading(true);
      const data = await dataService.getHalls();
      const hallData = data.find(h => h.id === selectedHallId);
      const elemData = await dataService.getHallElements(selectedHallId);
      setHall((hallData as Hall) || null);
      setElements(elemData || []);
      
      const eventsData = await dataService.getEvents();
      const evtData = eventsData.filter(e => e.hall_id === selectedHallId);
      setEvents(evtData || []);
      setLoading(false);
    };
    fetchHall();
  }, [selectedHallId]);

  useEffect(() => {
    if (!selectedEventId) {
      setAssignments(new Map());
      return;
    }
    const fetchAssignments = async () => {
      const attendees = await dataService.getAttendees(selectedEventId);
      const assigns = await dataService.getAssignments(selectedEventId);
      const m = new Map<string, Attendee>();
      for (const a of assigns) {
        const att = attendees.find((at) => at.id === a.attendee_id);
        if (att) m.set(a.element_id, att);
      }
      setAssignments(m);
    };
    fetchAssignments();
  }, [selectedEventId]);

  const chairWidth = 128;
  const chairHeight = 82;
  const chairGapX = 12;
  const chairGapY = 18;
  const chairs = elements.filter((element) => element.element_type === 'chair');
  const layoutScale = chairs.reduce((scale, chair, index) => {
    return chairs.slice(index + 1).reduce((pairScale, other) => {
      const distanceX = Math.abs((chair.x || 0) - (other.x || 0));
      const distanceY = Math.abs((chair.y || 0) - (other.y || 0));
      const requiredX = distanceX > 0 ? (chairWidth + chairGapX) / distanceX : Number.POSITIVE_INFINITY;
      const requiredY = distanceY > 0 ? (chairHeight + chairGapY) / distanceY : Number.POSITIVE_INFINITY;
      const requiredScale = Math.min(requiredX, requiredY);
      return Number.isFinite(requiredScale) ? Math.max(pairScale, requiredScale) : pairScale;
    }, scale);
  }, 1);
  const elementBounds = elements.reduce(
    (bounds, element) => {
      const left = (element.x || 0) * layoutScale;
      const top = (element.y || 0) * layoutScale;
      const width = element.element_type === 'chair' ? chairWidth : (element.width || 32) * layoutScale;
      const height = element.element_type === 'chair' ? chairHeight : (element.height || 32) * layoutScale;
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
  const originX = Number.isFinite(elementBounds.minX) ? elementBounds.minX - contentPadding : 0;
  const originY = Number.isFinite(elementBounds.minY) ? elementBounds.minY - contentPadding : 0;
  const hasElements = elements.length > 0;
  const maxX = hasElements ? elementBounds.maxX - originX + contentPadding : 800;
  const maxY = hasElements ? elementBounds.maxY - originY + contentPadding : 500;

  useEffect(() => {
    const fit = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const padding = 32;
      const sx = (rect.width - padding) / maxX;
      const sy = (rect.height - padding) / maxY;
      const readableScale = Math.min(sx, sy, 2.4);
      setBaseScale(Math.max(readableScale, 0.2));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [maxX, maxY, isFullscreen]);

  // Reset pan/zoom when switching fullscreen or hall
  const resetZoom = () => {
    setUserZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    resetZoom();
  }, [selectedHallId, isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else {
        document.documentElement.requestFullscreen?.();
      }
    } else {
      document.exitFullscreen?.();
    }
  };

  const zoomIn = () => {
    setUserZoom((prev) => Math.min(prev * 1.2, 5));
  };

  const zoomOut = () => {
    setUserZoom((prev) => Math.max(prev / 1.2, 0.3));
  };

  // Wheel zoom centered
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setUserZoom((prev) => {
      const next = prev * factor;
      return Math.min(Math.max(next, 0.3), 5);
    });
  };

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click or middle click
    if (e.button !== 0 && e.button !== 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const currentScale = baseScale * userZoom;

  if (loading && !hall) return <LoadingSpinner label="Đang tải..." />;

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trình chiếu</h1>
            <p className="text-sm text-gray-500">Hiển thị sơ đồ chỗ ngồi trên màn hình LED</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-gray-400" />
              <select
                value={selectedHallId}
                onChange={(e) => setSelectedHallId(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="">-- Chọn hội trường --</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            {hall && events.length > 0 && (
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-gray-400" />
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  <option value="">-- Chọn sự kiện --</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>{evt.name}</option>
                  ))}
                </select>
              </div>
            )}
            {hall && (
              <button onClick={toggleFullscreen} className="btn-secondary">
                <Maximize2 size={16} />
                Toàn màn hình
              </button>
            )}
          </div>
        </div>
      )}

      {!selectedHallId && (
        <div className="card p-12 flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
          <Monitor size={48} className="mb-3 opacity-50" />
          <p className="text-sm">Vui lòng chọn hội trường để bắt đầu trình chiếu</p>
        </div>
      )}

      {selectedHallId && hall && (
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative overflow-hidden bg-gray-900 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
            } ${isFullscreen
              ? 'fixed inset-0 z-[9999] rounded-none w-screen h-screen border-none m-0 p-0'
              : 'card flex-1 min-h-[500px]'
            }`}
          style={{ minHeight: isFullscreen ? '100vh' : 'calc(100vh - 12rem)' }}
        >
          {/* Floating Control Toolbar */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-800/80 hover:bg-gray-800 text-white rounded-lg p-1 backdrop-blur border border-gray-700 shadow-lg opacity-60 hover:opacity-100 transition-all duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomOut();
                }}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                title="Thu nhỏ (Cuộn chuột xuống)"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetZoom();
                }}
                className="px-2 py-1 text-xs font-medium text-gray-300 hover:text-white rounded hover:bg-gray-700 transition-colors"
                title="Khôi phục tỉ lệ ban đầu"
              >
                {Math.round(userZoom * 100)}%
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomIn();
                }}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                title="Phóng to (Cuộn chuột lên)"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetZoom();
                }}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border-l border-gray-700 ml-0.5"
                title="Đặt lại vị trí giữa màn hình"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {isFullscreen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-white text-xs backdrop-blur border border-gray-700 shadow-lg opacity-60 hover:opacity-100 transition-all duration-200"
                title="Thoát toàn màn hình (phím ESC)"
              >
                <Minimize2 size={16} />
                Thoát
              </button>
            )}
          </div>

          {/* Centered Canvas Container with balanced Zoom & Pan */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6 pb-16">
            <div
              className="relative shrink-0 pointer-events-auto transition-transform duration-75 ease-out"
              style={{
                width: maxX,
                height: maxY,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
                transformOrigin: 'center center',
              }}
            >
              {elements.map((elem, idx) => {
                const isChair = elem.element_type === 'chair';
                const isGuest = elem.seat_type === 'guest';
                const attendee = isChair && selectedEventId ? assignments.get(elem.id) : undefined;
                const seatLabel = elem.label || `Ghế ${idx + 1}`;
                return (
                  <div
                    key={elem.id || `element-${idx}`}
                    className={`absolute flex ${isChair
                        ? 'flex-col items-center justify-center rounded-xl px-3 py-2'
                        : 'items-center justify-center rounded-md'
                      } border-2 ${isGuest
                        ? 'bg-amber-900 border-amber-500 text-amber-100'
                        : isChair
                          ? 'bg-brand-900 border-brand-500 text-brand-100'
                          : elem.element_type === 'stage'
                            ? 'bg-purple-900 border-purple-500 text-purple-200'
                            : 'bg-gray-800 border-gray-600 text-gray-300'
                      } ${elem.element_type === 'zone' ? 'border-dashed' : ''}`}
                    style={{
                      left: (elem.x || 0) * layoutScale - originX,
                      top: (elem.y || 0) * layoutScale - originY,
                      width: isChair ? chairWidth : (elem.width || 32) * layoutScale,
                      height: isChair ? chairHeight : (elem.height || 32) * layoutScale,
                      transform: `rotate(${elem.rotation || 0}deg)`,
                    }}
                  >
                    {isChair && (
                      <span className="absolute left-2 top-1 text-[10px] font-semibold opacity-70">
                        {seatLabel}
                      </span>
                    )}
                    {isChair ? (
                      attendee ? (
                        <div className="mt-3 flex w-full flex-col items-center justify-center text-center leading-tight">
                          {attendee.title && (
                            <span className="block w-full truncate text-xs font-semibold opacity-90">
                              {attendee.title}
                            </span>
                          )}
                          <span className="block w-full max-h-[36px] overflow-hidden break-words text-sm font-bold">
                            {attendee.full_name}
                          </span>
                          <span className="mt-1 block w-full max-h-[24px] overflow-hidden break-words text-[11px] opacity-85">
                            {isGuest
                              ? attendee.department || 'Khách mời'
                              : attendee.position || attendee.degree || 'Đại biểu'}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 flex flex-col items-center gap-1 opacity-75">
                          <Armchair size={22} />
                          <span className="text-[11px]">Trống</span>
                        </div>
                      )
                    ) : elem.element_type === 'stage' ? (
                      <Mic2 size={20} />
                    ) : elem.element_type === 'table' ? (
                      <Table2 size={20} />
                    ) : elem.element_type === 'door' ? (
                      <DoorOpen size={16} />
                    ) : elem.element_type === 'wall' ? (
                      <Minus size={16} />
                    ) : elem.element_type === 'zone' ? (
                      <span className="text-xs font-medium px-2 text-center truncate">
                        {elem.label}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend bar */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-3 bg-gray-900/90 border-t border-gray-700 flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 bg-brand-900 border-brand-500" />
              Đại biểu
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 bg-amber-900 border-amber-500" />
              Khách mời
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 bg-purple-900 border-purple-500" />
              Sân khấu
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 bg-gray-800 border-gray-600" />
              Khác
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

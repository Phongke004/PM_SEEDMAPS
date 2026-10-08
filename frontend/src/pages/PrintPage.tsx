import { useState, useEffect, useRef } from 'react';
import { type Hall, type HallElement, type AppEvent, type Attendee, type Assignment } from '@/lib/supabase';
import { dataService } from '@/lib/dataService';
import { LoadingSpinner } from '@/components/PageHeader';
import {
  Printer,
  Building2,
  CalendarDays,
  Armchair,
  Table2,
  Mic2,
  DoorOpen,
  Minus,
} from 'lucide-react';

const ELEMENT_DEFAULTS: Record<string, { width: number; height: number; color: string; label: string }> = {
  chair: { width: 32, height: 32, color: 'bg-brand-100 border-brand-300 text-brand-700', label: 'Ghế' },
  table: { width: 120, height: 60, color: 'bg-blue-50 border-blue-300 text-blue-700', label: 'Bàn' },
  stage: { width: 300, height: 60, color: 'bg-purple-100 border-purple-300 text-purple-700', label: 'Sân khấu' },
  door: { width: 40, height: 8, color: 'bg-amber-200 border-amber-400 text-amber-700', label: 'Cửa' },
  wall: { width: 200, height: 6, color: 'bg-gray-300 border-gray-400 text-gray-600', label: 'Vách' },
  zone: { width: 200, height: 150, color: 'bg-green-50 border-green-300 border-dashed text-green-700', label: 'Khu vực' },
};

export function PrintPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHallId, setSelectedHallId] = useState('');
  const [hall, setHall] = useState<Hall | null>(null);
  const [elements, setElements] = useState<HallElement[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [assignments, setAssignments] = useState<Map<string, Attendee>>(new Map());
  const [loading, setLoading] = useState(true);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const [mapScale, setMapScale] = useState(1);
  const [mapPan] = useState({ x: 0, y: 0 }); // pan disabled for print; kept for future use

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
    const fitMap = () => {
      const viewport = mapViewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const padding = 32;
      const availableWidth = rect.width - padding;
      const availableHeight = rect.height > 0 ? rect.height - padding : 500;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      const sx = availableWidth / maxX;
      const sy = availableHeight / maxY;
      const readableScale = Math.min(sx, sy, 2.4);
      setMapScale(Math.max(readableScale, 0.4));
    };
    fitMap();

    const viewport = mapViewportRef.current;
    let observer: ResizeObserver | null = null;
    if (viewport && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        fitMap();
      });
      observer.observe(viewport);
    }

    window.addEventListener('resize', fitMap);

    const fitForPrint = () => {
      // Standard A4 Landscape printable area (~1040px width, ~660px height after header + legend)
      const printWidth = 1020;
      const printHeight = 580;
      const sx = printWidth / maxX;
      const sy = printHeight / maxY;
      setMapScale(Math.min(sx, sy, 2.2));
    };
    const restoreAfterPrint = () => fitMap();
    window.addEventListener('beforeprint', fitForPrint);
    window.addEventListener('afterprint', restoreAfterPrint);

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', fitMap);
      window.removeEventListener('beforeprint', fitForPrint);
      window.removeEventListener('afterprint', restoreAfterPrint);
    };
  }, [maxX, maxY, selectedHallId]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (loading && !hall) return <LoadingSpinner label="Đang tải..." />;

  return (
    <div className="space-y-4">
      {/* Controls - hidden when printing */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">In sơ đồ</h1>
          <p className="text-sm text-gray-500">In hoặc xuất PDF sơ đồ chỗ ngồi</p>
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
            <button onClick={() => window.print()} className="btn-primary">
              <Printer size={18} /> In / PDF
            </button>
          )}
        </div>
      </div>

      {!selectedHallId && (
        <div className="print:hidden card p-12 flex flex-col items-center justify-center text-gray-400">
          <Printer size={48} className="mb-3 opacity-50" />
          <p className="text-sm">Vui lòng chọn hội trường để in sơ đồ</p>
        </div>
      )}

      {selectedHallId && hall && (
        <div className="print-area card p-6 bg-white relative print:p-2 print:shadow-none print:border-none print:w-full print:h-full">
          {/* Print header */}
          <div className="text-center mb-4 pb-3 border-b-2 border-gray-300 print:mb-2 print:pb-1">
            <h2 className="text-xl font-bold text-gray-900 print:text-lg">{hall.name}</h2>
            {selectedEvent && <p className="text-sm text-gray-600 mt-1 print:text-xs print:mt-0.5">{selectedEvent.name}</p>}
            <p className="text-xs text-gray-400 mt-1 print:text-[10px] print:mt-0.5">Sơ đồ chỗ ngồi</p>
          </div>

          {/* Seat map – centered canvas, same approach as PresentationPage */}
          <div
            ref={mapViewportRef}
            className="relative overflow-hidden print:overflow-visible bg-gray-50 rounded-lg border border-gray-200 print:shadow-none print:border-none print:bg-transparent h-[min(60vh,600px)] print:h-[600px]"
          >
            {/* Absolute centering layer */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="relative shrink-0 pointer-events-auto"
                style={{
                  width: maxX,
                  height: maxY,
                  transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapScale})`,
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
                      className={`absolute flex ${
                        isChair
                          ? 'flex-col items-center justify-center rounded-xl px-3 py-2'
                          : 'items-center justify-center rounded-md'
                      } border-2 ${
                        isGuest
                          ? 'bg-amber-50 border-amber-400 text-amber-800'
                          : isChair
                            ? 'bg-brand-50 border-brand-400 text-brand-800'
                            : elem.element_type === 'stage'
                              ? 'bg-purple-100 border-purple-300 text-purple-700'
                              : elem.element_type === 'table'
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : elem.element_type === 'zone'
                                  ? 'bg-green-50 border-green-300 text-green-700'
                                  : elem.element_type === 'door'
                                    ? 'bg-amber-200 border-amber-400 text-amber-700'
                                    : 'bg-gray-300 border-gray-400 text-gray-600'
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
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-6 text-sm text-gray-600 print:mt-1 print:text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 bg-brand-50 border-brand-400" />
              Đại biểu
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 bg-amber-50 border-amber-400" />
              Khách mời
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 bg-purple-100 border-purple-300" />
              Sân khấu
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 bg-blue-50 border-blue-300" />
              Bàn
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

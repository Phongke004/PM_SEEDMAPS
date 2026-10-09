import { useState, useEffect } from 'react';
import { type Hall, type AppEvent } from '@/lib/supabase';
import { SecureStorage } from '@/utils/storage';
import { dataService } from '@/lib/dataService';
import { LoadingSpinner, ErrorBanner } from '@/components/PageHeader';
import { type Page } from '@/components/Sidebar';
import {
  Building2,
  CalendarDays,
  Users,
  Armchair,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

type DashboardProps = {
  onNavigate: (page: Page) => void;
};

export function DashboardPage({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    halls: 0,
    events: 0,
    attendees: 0,
    assignments: 0,
    chairs: 0,
  });
  const [recentEvents, setRecentEvents] = useState<AppEvent[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkAccess = (page: Page) => {
    const userRoles = SecureStorage.getItem<string[]>('userRoles') || [];
    const userPermissions = SecureStorage.getItem<string[]>('userPermissions') || [];
    const isAdmin = userRoles.map(r => r.toLowerCase()).includes('admin');
    
    if (isAdmin) return true;
    
    if (page === 'events') return userPermissions.includes('EVENT_VIEW');
    if (page === 'attendees') return userPermissions.includes('EVENT_VIEW');
    if (page === 'assignment') return userPermissions.includes('EVENT_VIEW') || userPermissions.includes('EVENT_EDIT');
    if (page === 'halls') return userPermissions.includes('HALL_VIEW') || userPermissions.includes('HALL_CREATE') || userPermissions.includes('HALL_UPDATE');
    if (page === 'designer') return userPermissions.includes('HALL_DESIGN') || userPermissions.includes('HALL_VIEW');
    
    return false;
  };

  const handleNavigate = (page: Page) => {
    if (checkAccess(page)) {
      onNavigate(page);
    } else {
      showToast('Bạn không có quyền truy cập chức năng này.', 'error');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [hallsData, eventsData] = await Promise.all([
          dataService.getHalls(),
          dataService.getEvents(),
        ]);

        const allElements = await Promise.all(
          hallsData.map((h) => dataService.getHallElements(h.id))
        );
        const chairCount = allElements.flat().filter((e: any) => e.element_type === 'chair').length;

        const allAttendees = await Promise.all(
          eventsData.map((e) => dataService.getAttendees(e.id))
        );
        const attendeeCount = allAttendees.flat().length;

        const allAssignments = await Promise.all(
          eventsData.map((e) => dataService.getAssignments(e.id))
        );
        const assignmentCount = allAssignments.flat().filter((a: any) => a.attendee_id).length;

        setStats({
          halls: hallsData.length,
          events: eventsData.length,
          attendees: attendeeCount,
          assignments: assignmentCount,
          chairs: chairCount,
        });
        setRecentEvents(
          [...eventsData]
            .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
            .slice(0, 5) as AppEvent[]
        );
        setHalls(hallsData.slice(0, 10) as Hall[]);
      } catch {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      }
      setLoading(false);
    })();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) return <LoadingSpinner label="Đang tải tổng quan..." />;

  const statCards = [
    { label: 'Hội trường', value: stats.halls, icon: Building2, color: 'text-brand-600', bg: 'bg-brand-50', page: 'halls' as Page },
    { label: 'Sự kiện', value: stats.events, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50', page: 'events' as Page },
    { label: 'Người tham dự', value: stats.attendees, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', page: 'attendees' as Page },
    { label: 'Chỗ đã bố trí', value: stats.assignments, icon: Armchair, color: 'text-purple-600', bg: 'bg-purple-50', page: 'assignment' as Page },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Phần mềm Sơ đồ Vị trí Chỗ ngồi Hội trường Bệnh viện
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => handleNavigate(card.page)}
              className="card p-5 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}>
                  <Icon size={24} />
                </div>
                <ArrowRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm text-gray-500 mt-1">{card.label}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={18} className="text-brand-500" /> Sự kiện gần đây
              </h3>
              <button
                onClick={() => handleNavigate('events')}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                Xem tất cả
              </button>
            </div>

            {recentEvents.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                Chưa có sự kiện nào
              </div>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((evt) => {
                  const hall = halls.find((h) => h.id === evt.hall_id);
                  return (
                    <button
                      key={evt.id}
                      onClick={() => handleNavigate('assignment')}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                        <CalendarDays size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{evt.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatDate(evt.event_date)} · {hall?.name || 'N/A'}
                        </div>
                      </div>
                      <span className={`badge ${
                        evt.status === 'completed' ? 'bg-green-100 text-green-700' :
                        evt.status === 'assigned' ? 'bg-brand-100 text-brand-700' :
                        evt.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {evt.status === 'completed' ? 'Hoàn thành' :
                         evt.status === 'assigned' ? 'Đã bố trí' :
                         evt.status === 'open' ? 'Đang mở' :
                         'Lên kế hoạch'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-brand-500" /> Thống kê
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tổng số ghế</span>
                <span className="text-lg font-bold text-gray-900">{stats.chairs}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Đã bố trí</span>
                <span className="text-lg font-bold text-brand-600">{stats.assignments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tỷ lệ lấp đầy</span>
                <span className="text-lg font-bold text-gray-900">
                  {stats.chairs > 0 ? Math.round((stats.assignments / stats.chairs) * 100) : 0}%
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-500"
                    style={{ width: `${stats.chairs > 0 ? Math.round((stats.assignments / stats.chairs) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Truy cập nhanh</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleNavigate('halls')}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 transition-colors text-left"
              >
                <Building2 size={18} className="text-brand-600" />
                <span className="text-sm text-gray-700">Quản lý hội trường</span>
                <ArrowRight size={14} className="ml-auto text-gray-300" />
              </button>
              <button
                onClick={() => handleNavigate('designer')}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 transition-colors text-left"
              >
                <Armchair size={18} className="text-brand-600" />
                <span className="text-sm text-gray-700">Thiết kế sơ đồ</span>
                <ArrowRight size={14} className="ml-auto text-gray-300" />
              </button>
              <button
                onClick={() => handleNavigate('assignment')}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-brand-50 transition-colors text-left"
              >
                <CheckCircle2 size={18} className="text-brand-600" />
                <span className="text-sm text-gray-700">Bố trí chỗ ngồi</span>
                <ArrowRight size={14} className="ml-auto text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast-fixed ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <div className="font-medium text-sm">{toast.message}</div>
        </div>
      )}
    </div>
  );
}

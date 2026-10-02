import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Grid3x3,
  CalendarDays,
  Users,
  Armchair,
  Menu,
  X,
  Monitor,
  Printer,
} from 'lucide-react';

export type Page =
  | 'dashboard'
  | 'halls'
  | 'designer'
  | 'events'
  | 'attendees'
  | 'assignment'
  | 'presentation'
  | 'print';

type NavItem = {
  id: Page;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, description: 'Bảng điều khiển' },
  { id: 'halls', label: 'Hội trường', icon: Building2, description: 'Quản lý hội trường' },
  { id: 'designer', label: 'Thiết kế sơ đồ', icon: Grid3x3, description: 'Sơ đồ chỗ ngồi' },
  { id: 'events', label: 'Sự kiện', icon: CalendarDays, description: 'Quản lý sự kiện' },
  { id: 'attendees', label: 'Người tham dự', icon: Users, description: 'Danh sách người tham dự' },
  { id: 'assignment', label: 'Bố trí chỗ ngồi', icon: Armchair, description: 'Gán chỗ ngồi' },
  { id: 'presentation', label: 'Trình chiếu', icon: Monitor, description: 'Màn hình LED' },
  { id: 'print', label: 'In sơ đồ', icon: Printer, description: 'In / xuất PDF' },
];

type SidebarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPage]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-40
          bg-white border-r border-gray-200
          flex flex-col
          transition-all duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 h-16">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
            <Armchair className="text-white" size={22} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">SeatMap</h1>
              <p className="text-xs text-gray-500 leading-tight">Sơ đồ chỗ ngồi</p>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center text-gray-500 hover:text-brand-600 transition-colors"
        >
          {isCollapsed ? <Menu size={14} /> : <X size={14} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={20}
                  className={`flex-shrink-0 ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                />
                {!isCollapsed && (
                  <div className="text-left">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-400 text-center">
              Phần mềm Sơ đồ Vị trí<br />Chỗ ngồi Hội trường
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

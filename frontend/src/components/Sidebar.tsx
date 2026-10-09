import { useEffect, useState, useRef } from 'react';
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
  Shield,
  LogOut,
  UserCircle,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  List,
  Settings,
  Circle
} from 'lucide-react';
import { apiAuth } from '@/lib/api';
import { SecureStorage } from '@/utils/storage';

export type Page =
  | 'dashboard'
  | 'halls'
  | 'designer'
  | 'events'
  | 'attendees'
  | 'assignment'
  | 'presentation'
  | 'print'
  | 'accounts';

type NavItem = {
  id: Page;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
};

type NavGroup = {
  id: string;
  label: string;
  icon?: any;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    id: 'main',
    label: '',
    items: [
      { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, description: 'Bảng điều khiển' },
    ]
  },
  {
    id: 'category',
    label: 'Danh mục',
    icon: List,
    items: [
      { id: 'halls', label: 'Hội trường', icon: Building2, description: 'Quản lý hội trường' },
      { id: 'events', label: 'Sự kiện', icon: CalendarDays, description: 'Quản lý sự kiện' },
      { id: 'attendees', label: 'Người tham dự', icon: Users, description: 'Danh sách người tham dự' },
      { id: 'assignment', label: 'Bố trí chỗ ngồi', icon: Armchair, description: 'Gán chỗ ngồi' },
    ]
  },
  {
    id: 'system',
    label: 'Hệ thống',
    icon: Settings,
    items: [
      { id: 'designer', label: 'Thiết kế sơ đồ', icon: Grid3x3, description: 'Sơ đồ chỗ ngồi' },
      { id: 'presentation', label: 'Trình chiếu', icon: Monitor, description: 'Màn hình LED' },
      { id: 'print', label: 'In sơ đồ', icon: Printer, description: 'In / xuất PDF' }
    ]
  },
  {
    id: 'auth',
    label: 'Phân quyền',
    icon: Shield,
    items: [
      { id: 'accounts', label: 'Tài khoản', icon: Users, description: 'Quản lý tài khoản' }
    ]
  }
];

type SidebarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  userInfo?: {
    fullName?: string;
    username?: string;
    email?: string;
  } | null;
  userPermissions?: string[];
  userRoles?: string[];
};

export function Sidebar({ currentPage, onNavigate, onLogout, userInfo, userPermissions = [], userRoles = [] }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    category: true,
    system: true
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    setMobileOpen(false);
  }, [currentPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenProfile = () => {
    setEditFullName(userInfo?.fullName || '');
    setEditEmail(userInfo?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setIsEditingProfile(false);
    setProfileMessage({ type: '', text: '' });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setIsSavingProfile(true);

    try {
      await apiAuth.updateProfile({
        fullName: editFullName,
        email: editEmail,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      setProfileMessage({ type: 'success', text: 'Cập nhật thành công! Vui lòng đăng nhập lại để làm mới thông tin.' });
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Lỗi cập nhật thông tin' });
    } finally {
      setIsSavingProfile(false);
    }
  };

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
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Logo BV 108" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Bệnh viện 108</h1>
              <p className="text-xs text-gray-500 leading-tight truncate">Quản lý sơ đồ chỗ ngồi</p>
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
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navGroups.map((group) => {
            const groupItems = group.items.filter(item => {
              const isAdmin = userRoles.map(r => r.toLowerCase()).includes('admin');
              if (isAdmin) return true;
              
              if (item.id === 'dashboard') return true;
              
              const perms = userPermissions;
              if (item.id === 'events') return perms.includes('EVENT_VIEW');
              if (item.id === 'attendees') return perms.includes('EVENT_VIEW');
              if (item.id === 'assignment') return perms.includes('EVENT_VIEW') || perms.includes('EVENT_EDIT');
              if (item.id === 'halls') return perms.includes('HALL_VIEW') || perms.includes('HALL_CREATE') || perms.includes('HALL_UPDATE');
              if (item.id === 'designer') return perms.includes('HALL_DESIGN') || perms.includes('HALL_VIEW');
              if (item.id === 'print' || item.id === 'presentation') return perms.includes('EVENT_VIEW');
              if (item.id === 'accounts') return perms.includes('USER_VIEW') || perms.includes('SYS_ROLE');
              
              return false;
            });

            if (groupItems.length === 0) return null;

            const isExpanded = expandedGroups[group.id];
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="space-y-1">
                {group.label && !isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {GroupIcon && <GroupIcon size={18} className="text-gray-500" />}
                      {group.label}
                    </div>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}
                
                {group.label && isCollapsed && (
                   <div className="flex justify-center py-2" title={group.label}>
                     {GroupIcon && <GroupIcon size={20} className="text-gray-400" />}
                   </div>
                )}

                {(!group.label || isExpanded || isCollapsed) && (
                  <div className={group.label && !isCollapsed ? 'pl-2' : ''}>
                    {groupItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.id)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200 group mb-1
                            ${isActive
                              ? 'bg-brand-50 text-brand-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <Icon
                            size={group.label ? 18 : 20}
                            className={`flex-shrink-0 ${group.label ? 'ml-1' : ''} ${isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                          />
                          {!isCollapsed && (
                            <div className="text-left">
                              <div className="text-sm">{item.label}</div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

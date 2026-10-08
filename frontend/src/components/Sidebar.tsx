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
  Shield,
  LogOut,
  UserCircle,
  MoreVertical
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
  | 'rbac';

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
  { id: 'rbac', label: 'Phân quyền', icon: Shield, description: 'Quản lý truy cập' },
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
};

export function Sidebar({ currentPage, onNavigate, onLogout, userInfo }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
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

        {/* User Menu & Footer */}
        <div className="border-t border-gray-200 mt-auto">
          {!isCollapsed && userInfo && (
            <div className="p-3">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors relative group cursor-pointer">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                  {userInfo.fullName?.charAt(0) || userInfo.username?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userInfo.fullName || userInfo.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userInfo.username}</p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  <MoreVertical size={16} />
                </div>
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-gray-200 shadow-lg rounded-lg py-1 hidden group-hover:block z-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenProfile(); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserCircle size={16} />
                    Thông tin cá nhân
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="p-3 flex justify-center">
              <button 
                onClick={onLogout}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* User Profile Modal */}
      {showProfileModal && userInfo && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCircle className="text-brand-600" />
                Thông tin cá nhân
              </h2>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {profileMessage.text && (
                <div className={`mb-4 p-3 rounded-md text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {profileMessage.text}
                </div>
              )}

              {!isEditingProfile ? (
                <>
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-4xl shadow-inner border-4 border-white mb-4">
                      {userInfo.fullName?.charAt(0) || userInfo.username?.charAt(0) || 'U'}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{userInfo.fullName || userInfo.username}</h3>
                    <p className="text-sm font-medium text-brand-600 mt-1.5 px-3 py-1 bg-brand-50 rounded-full">
                      Vai trò: {(SecureStorage.getItem<string[]>('userRoles') || []).join(', ') || 'Chưa cập nhật'}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tên đăng nhập</label>
                      <div className="text-gray-900 font-medium">{userInfo.username}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email liên hệ</label>
                      <div className="text-gray-900 font-medium">{userInfo.email || 'Chưa cập nhật'}</div>
                    </div>
                  </div>
                </>
              ) : (
                <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                    <input type="text" value={userInfo.username} disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input required type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Đổi mật khẩu (không bắt buộc)</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              {!isEditingProfile ? (
                <>
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    Đóng
                  </button>
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    Cập nhật
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={() => { setIsEditingProfile(false); setProfileMessage({ type: '', text: '' }); }}
                    className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    form="profile-form"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

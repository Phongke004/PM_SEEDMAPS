import { useState, useRef, useEffect } from 'react';
import { Search, LogOut, UserCircle, X } from 'lucide-react';
import { SecureStorage } from '@/utils/storage';
import { apiAuth } from '@/lib/api';
import { navGroups, type Page } from './Sidebar';

type TopBarProps = {
  currentPage: Page;
  userInfo?: {
    fullName?: string;
    username?: string;
    email?: string;
  } | null;
  onLogout: () => void;
  userRoles?: string[];
};

export function TopBar({ currentPage, userInfo, onLogout, userRoles = [] }: TopBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

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
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 shadow-sm sticky top-0">
        <div className="flex-1 flex items-center">
          {(() => {
            let label = '';
            let description = '';
            for (const group of navGroups) {
              const item = group.items.find(i => i.id === currentPage);
              if (item) {
                label = item.label;
                description = item.description;
                break;
              }
            }
            if (label) {
              return (
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">{label}</h1>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
              );
            }
            return null;
          })()}
        </div>

        <div className="flex items-center gap-4">
          {/* User Profile */}
          {userInfo && (
            <div 
              ref={userMenuRef}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors relative cursor-pointer"
            >
              <div className="hidden sm:block text-right mr-1">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {userInfo.fullName || userInfo.username}
                </p>
                <p className="text-xs text-gray-500 leading-tight">{userInfo.username}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border border-brand-200 shadow-sm">
                {userInfo.fullName?.charAt(0) || userInfo.username?.charAt(0) || 'U'}
              </div>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-lg py-1 z-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); handleOpenProfile(); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <UserCircle size={16} />
                    Thông tin cá nhân
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); onLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

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
                      Vai trò: {userRoles.join(', ') || 'Chưa cập nhật'}
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

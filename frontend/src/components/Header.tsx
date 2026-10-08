import { useState, useRef, useEffect } from 'react';
import { UserCircle, LogOut, ChevronDown, X } from 'lucide-react';
import { SecureStorage } from '../utils/storage';

type HeaderProps = {
  userInfo?: {
    fullName?: string;
    username?: string;
    email?: string;
  } | null;
  onLogout: () => void;
};

export function Header({ userInfo, onLogout }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="flex justify-end items-center mb-6 z-30 relative">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
              {userInfo?.fullName?.charAt(0) || userInfo?.username?.charAt(0) || 'U'}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {userInfo?.fullName || userInfo?.username || 'Người dùng'}
            </span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userInfo?.fullName || userInfo?.username}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {userInfo?.email || userInfo?.username}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  setShowProfileModal(true);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <UserCircle size={18} className="text-gray-400" />
                Thông tin cá nhân
              </button>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
              >
                <LogOut size={18} className="text-red-500" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {showProfileModal && userInfo && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
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
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-4xl shadow-inner border-4 border-white mb-4">
                  {userInfo.fullName?.charAt(0) || userInfo.username?.charAt(0) || 'U'}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{userInfo.fullName || userInfo.username}</h3>
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
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowProfileModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

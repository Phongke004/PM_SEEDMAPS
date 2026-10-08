import { useState } from 'react';
import { UsersPage } from './UsersPage';
import { RbacPage } from './RbacPage';
import { Shield, UserCircle2, Users } from 'lucide-react';

export function PermissionsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="text-brand-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Phân quyền</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Thiết lập phân quyền hệ thống theo người dùng hoặc theo nhóm (roles).
      </p>

      {/* Tabs */}
      <div className="flex space-x-6 mb-6 border-b border-gray-200">
        <button
          className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm transition-colors relative ${
            activeTab === 'users' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('users')}
        >
          <UserCircle2 size={18} />
          Phân quyền Tài khoản
          {activeTab === 'users' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />
          )}
        </button>
        <button
          className={`pb-3 px-2 flex items-center gap-2 font-medium text-sm transition-colors relative ${
            activeTab === 'roles' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('roles')}
        >
          <Users size={18} />
          Thiết lập Nhóm quyền (Roles)
          {activeTab === 'roles' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 bg-gray-50/30 rounded-xl">
        {activeTab === 'users' ? <UsersPage /> : <RbacPage />}
      </div>
    </div>
  );
}

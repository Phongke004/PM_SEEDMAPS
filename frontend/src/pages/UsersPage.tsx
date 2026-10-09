import { useState, useEffect } from 'react';
import { apiAccounts, apiRoles, AppAccount, RbacModule, apiAuth, AppRole } from '@/lib/api';
import { Save, CheckSquare, Square, CheckCircle2, UserCircle2, Plus, X, Lock, Unlock, Key, ShieldAlert, AlertCircle, Search } from 'lucide-react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { checkPermission } from '@/utils/permissions';

export function UsersPage() {
  const [users, setUsers] = useState<AppAccount[]>([]);
  const [modules, setModules] = useState<RbacModule[]>([]);
  const [allRoles, setAllRoles] = useState<AppRole[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const canCreate = checkPermission('USER_CREATE');
  const canEdit = checkPermission('USER_EDIT');
  const canManageRoles = checkPermission('SYS_ROLE');
  
  // Selected function IDs for the currently selected user
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<Set<string>>(new Set());
  
  const [search, setSearch] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isDestructive: false,
    onConfirm: () => {}
  });

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    department: '',
    password: ''
  });

  // Reset Password Modal
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Assign Roles Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRolesList, setSelectedRolesList] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserPermissions(selectedUserId);
    } else {
      setSelectedFunctionIds(new Set());
    }
  }, [selectedUserId]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [fetchedUsers, fetchedModules, fetchedRoles] = await Promise.all([
        apiAccounts.getAll(),
        apiRoles.getModules(),
        apiRoles.getAll(),
      ]);
      setUsers(fetchedUsers);
      setModules(fetchedModules);
      setAllRoles(fetchedRoles);
      if (fetchedUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(fetchedUsers[0].id);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      setIsLoading(true);
      const functionIds = await apiAccounts.getPermissions(userId);
      setSelectedFunctionIds(new Set(functionIds));
    } catch (error) {
      console.error('Lỗi khi tải quyền của người dùng:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFunction = (functionId: string) => {
    setSelectedFunctionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(functionId)) {
        newSet.delete(functionId);
      } else {
        newSet.add(functionId);
      }
      return newSet;
    });
  };

  const handleToggleModule = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;

    const moduleFuncIds = mod.functions.map((f) => f.id);
    const allChecked = moduleFuncIds.every((id) => selectedFunctionIds.has(id));

    setSelectedFunctionIds((prev) => {
      const newSet = new Set(prev);
      if (allChecked) {
        moduleFuncIds.forEach((id) => newSet.delete(id));
      } else {
        moduleFuncIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedUserId) return;
    try {
      setIsSaving(true);
      await apiAccounts.updatePermissions(selectedUserId, Array.from(selectedFunctionIds));
      showToast('Cập nhật quyền cho người dùng thành công!', 'success');
    } catch (error) {
      console.error('Lỗi khi lưu quyền:', error);
      showToast('Không thể cập nhật quyền cho người dùng', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const res = await apiAuth.register({
        ...newUser,
        roleNames: ['User']
      });
      showToast('Tạo tài khoản thành công!', 'success');
      setIsCreateModalOpen(false);
      setNewUser({ username: '', fullName: '', email: '', phone: '', department: '', password: '' });
      await fetchInitialData();
      if (res && res.id) {
        setSelectedUserId(res.id);
      }
    } catch (error: any) {
      console.error('Lỗi khi tạo tài khoản:', error);
      showToast(error.message || 'Không thể tạo tài khoản.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLockToggle = async () => {
    if (!selectedUserId) return;
    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;
    
    const action = user.isLock ? 'mở khóa' : 'khóa';
    
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận thao tác',
      message: `Bạn có chắc muốn ${action} tài khoản này?`,
      isDestructive: !user.isLock,
      onConfirm: async () => {
        closeConfirm();
        try {
          await apiAccounts.lockAccount(selectedUserId, !user.isLock);
          showToast(`Đã ${action} tài khoản thành công!`, 'success');
          await fetchInitialData();
        } catch (error: any) {
          showToast(error.message || 'Lỗi khi thực hiện thao tác.', 'error');
        }
      }
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newPassword) return;
    
    try {
      setIsResetting(true);
      await apiAccounts.adminResetPassword(selectedUserId, newPassword);
      showToast('Đã đặt lại mật khẩu thành công!', 'success');
      setIsResetPwdOpen(false);
      setNewPassword('');
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi đặt lại mật khẩu.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const openRoleModal = () => {
    const user = users.find(u => u.id === selectedUserId);
    if (user) {
      setSelectedRolesList(user.roles || []);
    }
    setIsRoleModalOpen(true);
  };

  const handleAssignRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    try {
      setIsAssigning(true);
      await apiAccounts.assignRoles(selectedUserId, selectedRolesList);
      showToast('Đã cập nhật vai trò thành công!', 'success');
      setIsRoleModalOpen(false);
      await fetchInitialData();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi gán vai trò.', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const currentUser = users.find(u => u.id === selectedUserId);

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.fullName && u.fullName.toLowerCase().includes(search.toLowerCase())) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 mt-2">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10 w-full"
            placeholder="Tìm kiếm tài khoản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-shrink-0">
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={!selectedUserId || isSaving}
              className="btn-primary"
            >
              <Save size={20} />
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast-fixed ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <div className="font-medium text-sm">{toast.message}</div>
        </div>
      )}

      <div className="page-content-split">
        {/* Users List */}
        <div className="panel w-full md:w-1/3 md:max-w-[320px]">
          <div className="panel-header">
            <h2 className="panel-title">Danh sách Tài khoản</h2>
            {canCreate && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                title="Tạo tài khoản mới"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
          <div className="panel-body">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-all flex justify-between items-start ${
                  selectedUserId === user.id
                    ? 'bg-brand-50 border border-brand-200 text-brand-800'
                    : 'hover:bg-gray-50 border border-transparent text-gray-700'
                }`}
              >
                <div>
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    {user.fullName || user.username}
                    {user.isLock && (
                      <span title="Đã khóa" className="inline-flex">
                        <Lock size={12} className="text-red-500" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1 text-gray-500">
                    {user.username} {user.department ? ` - ${user.department}` : ''}
                  </div>
                  {user.roles && user.roles.length > 0 && (
                     <div className="text-[10px] mt-1 px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-full inline-block font-medium">
                       {user.roles.join(', ')}
                     </div>
                  )}
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && !isLoading && (
              <div className="text-center p-4 text-gray-500 text-sm">Không tìm thấy tài khoản</div>
            )}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="panel flex-1">
          <div className="panel-header flex-col items-stretch gap-3">
            <div className="flex items-center justify-between">
              <h2 className="panel-title">
                {currentUser ? `Quản lý: ${currentUser.fullName || currentUser.username}` : 'Cấp quyền chức năng riêng lẻ'}
              </h2>
              {isLoading && <span className="text-sm text-brand-600 animate-pulse">Đang tải dữ liệu...</span>}
            </div>
            
            {/* Action Bar for User */}
            {currentUser && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/60">
                {canEdit && (
                  <>
                    <button 
                      onClick={handleLockToggle}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
                        currentUser.isLock 
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      }`}
                    >
                      {currentUser.isLock ? <Unlock size={14} /> : <Lock size={14} />}
                      {currentUser.isLock ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                    </button>
                    <button 
                      onClick={() => setIsResetPwdOpen(true)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors"
                    >
                      <Key size={14} /> Reset mật khẩu
                    </button>
                  </>
                )}
                {canManageRoles && (
                  <button 
                    onClick={openRoleModal}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors"
                  >
                    <ShieldAlert size={14} /> Gán Vai trò (Role)
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="panel-body p-6">
            {!selectedUserId ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Vui lòng chọn một người dùng bên trái để thiết lập quyền
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center text-gray-500">Chưa có Module / Function nào trong hệ thống.</div>
            ) : (
              <div className="space-y-6">
                {modules.map((module) => {
                  const moduleFuncIds = module.functions.map((f) => f.id);
                  const isAllChecked = moduleFuncIds.length > 0 && moduleFuncIds.every((id) => selectedFunctionIds.has(id));
                  const isSomeChecked = moduleFuncIds.some((id) => selectedFunctionIds.has(id));

                  return (
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div 
                        className="bg-gray-50 px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200"
                        onClick={() => handleToggleModule(module.id)}
                      >
                        <button className="text-brand-600 focus:outline-none">
                          {isAllChecked ? (
                            <CheckSquare size={20} />
                          ) : isSomeChecked ? (
                            <div className="relative">
                              <Square size={20} className="text-brand-600" />
                              <div className="absolute inset-0 m-auto w-2.5 h-2.5 bg-brand-600 rounded-[2px]" />
                            </div>
                          ) : (
                            <Square size={20} className="text-gray-400" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-semibold text-gray-800">{module.name} <span className="text-xs font-normal text-gray-500 ml-2">({module.code})</span></h3>
                          {module.description && <p className="text-xs text-gray-500 mt-0.5">{module.description}</p>}
                        </div>
                      </div>

                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white">
                        {module.functions.map((func) => {
                          const isChecked = selectedFunctionIds.has(func.id);
                          return (
                            <div 
                              key={func.id} 
                              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                              onClick={() => handleToggleFunction(func.id)}
                            >
                              <button className="mt-0.5 flex-shrink-0 focus:outline-none">
                                {isChecked ? (
                                  <CheckSquare size={18} className="text-brand-600" />
                                ) : (
                                  <Square size={18} className="text-gray-400" />
                                )}
                              </button>
                              <div>
                                <div className="text-sm font-medium text-gray-700">{func.name}</div>
                                <div className="text-xs text-gray-500 mt-0.5" title={func.code}>{func.description || func.code}</div>
                              </div>
                            </div>
                          );
                        })}
                        {module.functions.length === 0 && (
                          <div className="text-xs text-gray-400 italic">Module này chưa có chức năng con nào.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md">
            <div className="modal-header">
              <h2 className="modal-title">
                <UserCircle2 className="text-brand-600" />
                Tạo tài khoản mới
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div>
                  <label className="label">Tên đăng nhập <span className="text-red-500">*</span></label>
                  <input required type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="input" placeholder="Nhập tên đăng nhập (viết liền không dấu)" />
                </div>
                <div>
                  <label className="label">Họ và tên <span className="text-red-500">*</span></label>
                  <input required type="text" value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="input" placeholder="Nhập họ và tên đầy đủ" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="input" placeholder="Nhập địa chỉ email" />
                </div>
                <div>
                  <label className="label">Số điện thoại</label>
                  <input type="tel" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="input" placeholder="Nhập số điện thoại" />
                </div>
                <div>
                  <label className="label">Khoa / Phòng ban</label>
                  <input type="text" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} className="input" placeholder="Nhập khoa/phòng ban" />
                </div>
                <div>
                  <label className="label">Mật khẩu <span className="text-red-500">*</span></label>
                  <input required type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="input" placeholder="••••••••" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={isCreating} className="btn-primary">
                  {isCreating ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPwdOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-sm">
            <div className="modal-header">
              <h2 className="modal-title">Đặt lại mật khẩu</h2>
              <button onClick={() => setIsResetPwdOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <p className="text-sm text-gray-600">Nhập mật khẩu mới cho tài khoản <strong>{currentUser?.username}</strong>:</p>
                <div>
                  <label className="label">Mật khẩu mới <span className="text-red-500">*</span></label>
                  <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" placeholder="Nhập mật khẩu mới..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsResetPwdOpen(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={isResetting || !newPassword} className="btn-primary">
                  {isResetting ? 'Đang lưu...' : 'Lưu mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Roles Modal */}
      {isRoleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md">
            <div className="modal-header">
              <h2 className="modal-title">Gán vai trò (Roles)</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAssignRoles}>
              <div className="modal-body">
                <p className="text-sm text-gray-600 mb-4">Chọn các vai trò cho tài khoản <strong>{currentUser?.username}</strong>:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {allRoles.map(role => {
                    const isChecked = selectedRolesList.includes(role.name);
                    return (
                      <label key={role.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRolesList([...selectedRolesList, role.name]);
                            } else {
                              setSelectedRolesList(selectedRolesList.filter(r => r !== role.name));
                            }
                          }}
                        />
                        <div>
                          <div className="font-medium text-gray-800">{role.name}</div>
                          {role.description && <div className="text-xs text-gray-500">{role.description}</div>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="btn-secondary">Hủy</button>
                <button type="submit" disabled={isAssigning} className="btn-primary">
                  {isAssigning ? 'Đang lưu...' : 'Cập nhật vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}

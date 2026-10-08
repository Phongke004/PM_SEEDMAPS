import { useState, useEffect } from 'react';
import { apiAccounts, apiRoles, AppAccount, RbacModule } from '@/lib/api';
import { Shield, Save, CheckSquare, Square, CheckCircle2, UserCircle2 } from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = useState<AppAccount[]>([]);
  const [modules, setModules] = useState<RbacModule[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Selected function IDs for the currently selected user
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      const [fetchedUsers, fetchedModules] = await Promise.all([
        apiAccounts.getAll(),
        apiRoles.getModules(),
      ]);
      setUsers(fetchedUsers);
      setModules(fetchedModules);
      if (fetchedUsers.length > 0) {
        setSelectedUserId(fetchedUsers[0].id);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu người dùng:', error);
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
        // Uncheck all
        moduleFuncIds.forEach((id) => newSet.delete(id));
      } else {
        // Check all
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
      
      setToastMessage('Cập nhật quyền cho người dùng thành công!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Lỗi khi lưu quyền:', error);
      alert('Không thể cập nhật quyền cho người dùng');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Gán quyền theo từng cá nhân
          </h2>
        </div>
        <button
          onClick={handleSave}
          disabled={!selectedUserId || isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Save size={20} />
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {toastMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Users List */}
        <div className="w-1/4 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-800">Danh sách Tài khoản</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                  selectedUserId === user.id
                    ? 'bg-brand-50 border border-brand-200 text-brand-800'
                    : 'hover:bg-gray-50 border border-transparent text-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{user.fullName || user.username}</div>
                <div className="text-xs mt-1 text-gray-500">
                  {user.username} {user.department ? ` - ${user.department}` : ''}
                </div>
                {user.roles && user.roles.length > 0 && (
                   <div className="text-[10px] mt-1 px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full inline-block">
                     {user.roles.join(', ')}
                   </div>
                )}
              </button>
            ))}
            {users.length === 0 && !isLoading && (
              <div className="text-center p-4 text-gray-500 text-sm">Chưa có Tài khoản nào</div>
            )}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Cấp quyền chức năng riêng lẻ</h2>
            {isLoading && <span className="text-sm text-brand-600 animate-pulse">Đang tải dữ liệu...</span>}
          </div>
          <div className="overflow-y-auto flex-1 p-6">
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
                    <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Module Header */}
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

                      {/* Functions List */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {module.functions.map((func) => {
                          const isChecked = selectedFunctionIds.has(func.id);
                          return (
                            <div 
                              key={func.id} 
                              className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
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
    </div>
  );
}

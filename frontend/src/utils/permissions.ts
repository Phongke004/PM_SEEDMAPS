import { SecureStorage } from '@/utils/storage';

export const checkPermission = (requiredPermission: string): boolean => {
  const userRoles = SecureStorage.getItem<string[]>('userRoles') || [];
  const isAdmin = userRoles.map((r) => r.toLowerCase()).includes('admin');
  if (isAdmin) return true;

  const userPermissions = SecureStorage.getItem<string[]>('userPermissions') || [];
  return userPermissions.includes(requiredPermission);
};

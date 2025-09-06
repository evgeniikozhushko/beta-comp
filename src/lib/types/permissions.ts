// Permission matrix 

export type UserRole = 'owner' | 'admin' | 'athlete' | 'official';

export interface Permission {
  canViewEvents: boolean;
  canCreateEvents: boolean;
  canUpdateOwnEvents: boolean;
  canDeleteOwnEvents: boolean;
  canUpdateAnyEvent: boolean;
  canDeleteAnyEvent: boolean;
  canManageEvents: boolean;
  canManageUsers: boolean;
  canRegisterForEvents: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  owner: {
    canViewEvents: true,
    canCreateEvents: true,
    canUpdateOwnEvents: true,
    canDeleteOwnEvents: true,
    canUpdateAnyEvent: true,
    canDeleteAnyEvent: true,
    canManageEvents: true,
    canManageUsers: true,
    canRegisterForEvents: true,
  },
  admin: {
    canViewEvents: true,
    canCreateEvents: true,
    canUpdateOwnEvents: true,
    canDeleteOwnEvents: true,
    canUpdateAnyEvent: true,
    canDeleteAnyEvent: true,
    canManageEvents: true,
    canManageUsers: true,
    canRegisterForEvents: false,
  },
  athlete: {
    canViewEvents: true,
    canCreateEvents: false,
    canUpdateOwnEvents: false,
    canDeleteOwnEvents: false,
    canUpdateAnyEvent: false,
    canDeleteAnyEvent: false,
    canManageEvents: false,
    canManageUsers: false,
    canRegisterForEvents: true,
  },
  official: {
    canViewEvents: true,
    canCreateEvents: false,
    canUpdateOwnEvents: false,
    canDeleteOwnEvents: false,
    canUpdateAnyEvent: false,
    canDeleteAnyEvent: false,
    canManageEvents: false,
    canManageUsers: false,
    canRegisterForEvents: false,
  },
};

export function hasPermission(
  role: UserRole,
  permission: keyof Permission
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function canManageEvent(
  userRole: UserRole,
  eventOwnerId: string,
  userId: string,
  action: 'update' | 'delete'
): boolean {
  if (hasPermission(userRole, action === 'update' ? 'canUpdateAnyEvent' : 'canDeleteAnyEvent')) {
    return true;
  }
  
  if (eventOwnerId === userId) {
    return hasPermission(userRole, action === 'update' ? 'canUpdateOwnEvents' : 'canDeleteOwnEvents');
  }
  
  return false;
}

export function getUserPermissions(role: UserRole): Permission {
  return ROLE_PERMISSIONS[role];
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}
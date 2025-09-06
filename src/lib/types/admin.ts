export interface AdminUser {
    id: string
    displayName: string
    email: string
    role: 'owner' | 'admin' | 'athlete' | 'official'
    creatAt: string
    picture?: string
}

export interface AdminUserListResponse {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }

  export interface AdminUserDetailResponse {
    id: string;
    displayName: string;
    email: string;
    role: 'owner' | 'admin' | 'athlete' | 'official';
    createdAt: string;
    updatedAt: string;
  }

  export interface AdminRoleUpdateRequest {
    role: 'owner' | 'admin' | 'athlete' | 'official';
  }

  export interface AdminErrorResponse {
    error: string;
    details?: string;
  }
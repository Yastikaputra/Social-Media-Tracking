const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function clearStoredAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set JSON content-type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredAuth();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const message = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    (error as any).data = data;
    (error as any).status = response.status;
    (error as any).isAuthError = response.status === 401;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res?.token) {
      setStoredToken(res.token);
      setStoredUser(res.user);
    }
    return res;
  },

  async getMe() {
    return request('/me');
  },

  async logout() {
    try {
      await request('/logout', { method: 'POST' });
    } finally {
      clearStoredAuth();
    }
  },

  // Brands & Platforms
  async getBrands() {
    return request('/brands');
  },

  async getBrand(slug: string) {
    return request(`/brands/${slug}`);
  },

  async getPlatforms() {
    return request('/platforms');
  },

  // Tracking Tasks
  async getTasks(params?: {
    brand_slug?: string;
    platform_slug?: string;
    brand_id?: number;
    platform_id?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/tracking-tasks${query}`);
  },

  async createTask(formData: FormData) {
    return request('/tracking-tasks', {
      method: 'POST',
      body: formData,
    });
  },

  async updateTask(id: number, formData: FormData) {
    // Laravel handles PUT with multipart/form-data best via POST + _method=PUT
    formData.append('_method', 'PUT');
    return request(`/tracking-tasks/${id}`, {
      method: 'POST',
      body: formData,
    });
  },

  async deleteTask(id: number) {
    return request(`/tracking-tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // Users Management
  async getUsers() {
    return request('/users');
  },

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    status: string;
  }) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id: number, userData: Partial<{
    name: string;
    email: string;
    password?: string;
    role: string;
    status: string;
  }>) {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: number) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Analytics & Diagrams
  async getDashboardAnalytics(params?: {
    brand_slug?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val) searchParams.append(key, String(val));
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/analytics/dashboard${query}`);
  },
};

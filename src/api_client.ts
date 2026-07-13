/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem('hotel_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const authApi = {
  login: async (username: string, password: string) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('hotel_token', data.token);
    localStorage.setItem('hotel_user', JSON.stringify(data.user));
    return data;
  },
  getMe: async () => {
    return apiFetch('/api/auth/me');
  },
  forgotPassword: async (email: string) => {
    return apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  logout: () => {
    localStorage.removeItem('hotel_token');
    localStorage.removeItem('hotel_user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('hotel_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  getPublicSettings: async () => {
    return apiFetch('/api/public/settings');
  }
};

export const shiftHandoverApi = {
  list: async () => {
    return apiFetch('/api/shift-handovers');
  },
  create: async (handover: { toRole: string; notes: string; tasks: any[] }) => {
    return apiFetch('/api/shift-handovers', {
      method: 'POST',
      body: JSON.stringify(handover)
    });
  },
  update: async (id: string, updates: any) => {
    return apiFetch(`/api/shift-handovers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },
  acknowledge: async (id: string) => {
    return apiFetch(`/api/shift-handovers/${id}/acknowledge`, {
      method: 'POST'
    });
  }
};


export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api'

function getAuthToken(): string | null {
  return localStorage.getItem('admin_auth_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    headers['X-Admin-Token'] = token
    console.log('Sending request with token:', token.substring(0, 20) + '...')
  } else {
    console.log('No token found for request to:', path)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  console.log('Response status:', res.status, 'for', path)

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || res.statusText
    console.error('API Error:', message, 'Status:', res.status)
    throw new Error(message)
  }
  return data
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: any } }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>(`/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),

  // Admin
  getUsers: () => request<{ success: boolean; data: any[] }>(`/admin/users`),
  getStats: () => request<{ success: boolean; data: { users: number; products: number; orders: number } }>(`/admin/stats`),
  getOrders: () => request<{ success: boolean; data: any[] }>(`/admin/orders`),
  getOrderById: (id: string) => request<{ success: boolean; data: any }>(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => 
    request<{ success: boolean; data: any }>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Templates
  getTemplates: () =>
    request<{ success: boolean; data: any[] }>(`/templates`),
  createTemplate: (form: FormData) =>
    request<{ success: boolean; data: any }>(`/templates`, {
      method: 'POST',
      body: form,
    }),
  updateTemplate: (id: string, form: FormData) =>
    request<{ success: boolean; data: any }>(`/templates/${id}`, {
      method: 'PUT',
      body: form,
    }),
  deleteTemplate: (id: string) =>
    request<{ success: boolean; message: string }>(`/templates/${id}`, {
      method: 'DELETE',
    }),

  // Products
  getProducts: () => request<{ success: boolean; data: any[] }>(`/products`),
  createProduct: (data: any) => request<{ success: boolean; data: any }>(`/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProduct: (id: string, data: any) => request<{ success: boolean; data: any }>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProduct: (id: string) => request<{ success: boolean; message: string }>(`/products/${id}`, {
    method: 'DELETE',
  }),

  // Designs
  getDesigns: (page: number = 1) => request<{ success: boolean; data: any[]; pagination: any }>(`/admin/designs?page=${page}`),

  // Settings
  getSettings: () => request<{ success: boolean; data: any }>(`/settings`),
  updateSettings: (form: FormData) =>
    request<{ success: boolean; data: any }>(`/settings`, { method: 'PUT', body: form, isForm: true }),

  // Coupons
  getCoupons: () => request<{ success: boolean; data: any[] }>(`/coupons`),
  getCouponById: (id: string) => request<{ success: boolean; data: any }>(`/coupons/${id}`),
  createCoupon: (data: any) => request<{ success: boolean; data: any }>(`/coupons`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCoupon: (id: string, data: any) => request<{ success: boolean; data: any }>(`/coupons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCoupon: (id: string) => request<{ success: boolean; message: string }>(`/coupons/${id}`, {
    method: 'DELETE',
  }),
}

export default api



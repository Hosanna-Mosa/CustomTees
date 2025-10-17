const BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000/api';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request(path: string, opts: { method?: Method; body?: any; isForm?: boolean } = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!opts.isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? (opts.isForm ? opts.body : JSON.stringify(opts.body)) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || res.statusText || 'Request failed';
    const status = res.status;
    throw { message, status };
  }
  return data;
}

export const fetchProducts = async () => {
  const res = await request('/products');
  return (res as any).data;
};

export const fetchProductBySlug = async (slug: string) => {
  const res = await request(`/products/${slug}`);
  return (res as any).data;
};

export const signup = async (data: { name: string; email: string; password: string }) => {
  return request('/auth/signup', { method: 'POST', body: data });
};

export const login = async (data: { email: string; password: string }) => {
  return request('/auth/login', { method: 'POST', body: data });
};

export const getMe = async () => request('/auth/me');
export const updateMe = async (body: { name?: string }) => request('/auth/me', { method: 'PUT', body });
export const addAddress = async (addr: any) => request('/auth/me/addresses', { method: 'POST', body: addr });
export const updateAddress = async (id: string, addr: any) => request(`/auth/me/addresses/${id}`, { method: 'PUT', body: addr });
export const deleteAddress = async (id: string) => request(`/auth/me/addresses/${id}`, { method: 'DELETE' });

export const adminAddProduct = async (form: FormData) => {
  return request('/products', { method: 'POST', body: form, isForm: true });
};

export const adminUpdateProduct = async (id: string, form: FormData) => {
  return request(`/products/${id}`, { method: 'PUT', body: form, isForm: true });
};

export const adminDeleteProduct = async (id: string) => {
  return request(`/products/${id}`, { method: 'DELETE' });
};

// Orders
export const createOrder = async (body: { productId: string; quantity?: number; paymentMethod: 'cod' | 'razorpay'; shippingAddress?: any }) => {
  return request('/orders', { method: 'POST', body });
};

export const myOrders = async () => {
  const res = await request('/orders/mine');
  return (res as any).data;
};

export default { request };



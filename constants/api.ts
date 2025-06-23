const BASE_URL = 'http://192.168.9.111:3000/api';

type ApiOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const contentType = res.headers.get('content-type');
  let data;

  if (contentType && contentType.indexOf('application/json') !== -1) {
    data = await res.json();
  } else {
    data = await res.text(); // Get response as text if not JSON
  }

  if (!res.ok) {
    // If the data is the raw HTML/text, it will be thrown here
    const errorPayload = typeof data === 'object' ? data : { message: data };
    throw { status: res.status, data: errorPayload };
  }
  
  return { ok: res.ok, status: res.status, data };
}

export async function apiFetchAuth(endpoint: string, token: string, options: ApiOptions = {}) {
  return apiFetch(endpoint, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
} 
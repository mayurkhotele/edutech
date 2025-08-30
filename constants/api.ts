// const BASE_URL = 'https://examindia-production.up.railway.app/api';
// const BASE_URL = 'https://examindia-production.up.railway.app/api';

const BASE_URL = 'http://192.168.1.3:3000/api';

type ApiOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;
  
  const fullUrl = `${BASE_URL}${endpoint}`;
  console.log('API Fetch called with:', {
    url: fullUrl,
    method,
    body: body ? 'Body present' : 'No body',
    headers
  });

  try {
    const res = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    console.log('Fetch response received:', {
      status: res.status,
      ok: res.ok,
      statusText: res.statusText
    });

    const contentType = res.headers.get('content-type');
    let data;

    if (contentType && contentType.indexOf('application/json') !== -1) {
      data = await res.json();
    } else {
      data = await res.text(); // Get response as text if not JSON
    }

    console.log('Response data:', data);

    if (!res.ok) {
      // If the data is the raw HTML/text, it will be thrown here
      const errorPayload = typeof data === 'object' ? data : { message: data };
      console.log('API error payload:', errorPayload);
      throw { status: res.status, data: errorPayload };
    }
    
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    console.error('API Fetch error:', error);
    throw error;
  }
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

export function getImageUrl(relativePath: string): string {
  return `${BASE_URL.replace('/api', '')}${relativePath}`;
}

export async function uploadFile(fileUri: string, token: string): Promise<string> {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'image.jpg';
  
  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: 'image/jpeg',
  } as any);

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload failed:', response.status, errorText);
    throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Upload response:', result);
  
  // Handle different possible response formats
  const url = result.url || result.imageUrl || result.fileUrl || result.mediaUrl;
  if (!url) {
    console.error('No URL found in upload response:', result);
    throw new Error('Upload response does not contain a valid URL');
  }
  
  return url;
} 
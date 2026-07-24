import { getClientCookie } from './cookies';
import type { ApiEnvelope, ApiErrorBody } from '@/types/api';

const API_BASE = '/api/v1';
const CSRF_COOKIE = 'idlib_csrf';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export class ApiError extends Error {
  readonly statusCode: number;
  readonly body: ApiErrorBody;

  constructor(body: ApiErrorBody) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.body = body;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
  signal?: AbortSignal;
}

let refreshInFlight: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  refreshInFlight ??= fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { [CSRF_HEADER]: getClientCookie(CSRF_COOKIE) ?? '' },
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const method = options.method ?? 'GET';
  const headers = new Headers();

  if (!SAFE_METHODS.has(method)) {
    headers.set(CSRF_HEADER, getClientCookie(CSRF_COOKIE) ?? '');
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.isFormData) {
      body = options.body as FormData;
    } else {
      headers.set('Content-Type', 'application/json');
      body = JSON.stringify(options.body);
    }
  }

  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body,
    credentials: 'same-origin',
    signal: options.signal,
  });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await rawRequest(path, options);

  // Access token expired mid-session — refresh once via the httpOnly refresh
  // cookie and silently retry, so a short 15-minute access token never surfaces
  // as a jarring logout while the user is still within their refresh window.
  if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      res = await rawRequest(path, options);
    }
  }

  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    throw new ApiError((json as ApiErrorBody) ?? { statusCode: res.status, message: res.statusText, error: 'Error', timestamp: new Date().toISOString(), path });
  }

  return (json as ApiEnvelope<T>).data;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>(path, { method: 'POST', body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>(path, { method: 'PATCH', body, signal }),
  del: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'DELETE', signal }),
  upload: <T>(path: string, form: FormData, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body: form, isFormData: true, signal }),
};

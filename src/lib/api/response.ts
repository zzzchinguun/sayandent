import { NextResponse } from 'next/server';

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiResponsePaginated<T>(
  data: T[],
  meta: { page: number; pageSize: number; total: number }
) {
  return NextResponse.json({
    success: true,
    data,
    meta: { ...meta, totalPages: Math.ceil(meta.total / meta.pageSize) },
  }, { status: 200 });
}

export function apiBadRequest(message: string, errors?: Record<string, string[]>) {
  return NextResponse.json({ success: false, error: message, errors }, { status: 400 });
}

export function apiUnauthorized(message = 'Unauthorized') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function apiForbidden(message = 'Forbidden') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function apiNotFound(message = 'Resource not found') {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function apiInternalError(err?: unknown) {
  if (err) console.error('[API Error]', err);
  return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
}

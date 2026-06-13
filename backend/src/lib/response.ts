import { NextResponse } from 'next/server';

export const ok = <T>(data: T, status = 200) =>
  NextResponse.json({ success: true, data }, { status });

export const created = <T>(data: T) => ok(data, 201);

export const noContent = () => new NextResponse(null, { status: 204 });

export const error = (message: string, status = 400, details?: any) =>
  NextResponse.json({ success: false, error: message, ...(details && { details }) }, { status });

export const unauthorized = (msg = 'Unauthorized') => error(msg, 401);
export const forbidden = (msg = 'Forbidden') => error(msg, 403);
export const notFound = (res = 'Resource') => error(`${res} not found`, 404);
export const conflict = (msg: string) => error(msg, 409);
export const tooManyRequests = (msg = 'Too many requests') => error(msg, 429);

export const serverError = (err: unknown) => {
  console.error('Server error:', err);
  return error(err instanceof Error ? err.message : 'Internal server error', 500);
};

export async function parseBody<T>(
  req: Request,
  schema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: any } }
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) return { error: error('Validation failed', 400, result.error?.flatten()) };
    return { data: result.data! };
  } catch {
    return { error: error('Invalid JSON body', 400) };
  }
}

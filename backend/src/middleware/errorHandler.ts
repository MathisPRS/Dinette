import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  console.error('[Error]', err);

  if (res.headersSent) return;

  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status ?? 500;
    const message =
      process.env.NODE_ENV === 'production' && status === 500
        ? 'Internal server error'
        : err.message;
    res.status(status).json({ error: message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}

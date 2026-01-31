import { Request, Response } from 'express';
import { browserPool } from '../services/browser-pool.service';

export function healthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}

export function detailedHealthCheck(_req: Request, res: Response): void {
  const poolStatus = browserPool.getStatus();
  const memoryUsage = process.memoryUsage();

  const status = poolStatus.available > 0 ? 'healthy' : poolStatus.busy > 0 ? 'degraded' : 'unhealthy';

  res.json({
    status,
    timestamp: new Date().toISOString(),
    browserPool: poolStatus,
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    },
    uptime: Math.round(process.uptime()),
  });
}

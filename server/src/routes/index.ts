import { Router } from 'express';
import analyzeRoutes from './analyze.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/analyze', analyzeRoutes);
router.use('/health', healthRoutes);

export default router;

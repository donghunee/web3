import { Router } from 'express';
import { analyzeUrl, screenshotOnly } from '../controllers/analyze.controller';
import { urlValidator } from '../middleware/url-validator';
import { analyzeLimiter } from '../middleware/rate-limiter';

const router = Router();

// Full analysis endpoint
router.post('/', analyzeLimiter, urlValidator, analyzeUrl);

// Screenshot only endpoint
router.post('/screenshot', analyzeLimiter, urlValidator, screenshotOnly);

export default router;

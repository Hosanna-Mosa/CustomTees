import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/setting.controller.js';
import { upload } from '../middlewares/upload.middleware.js';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getSettings);
router.put('/', protect, verifyAdmin, upload.fields([
  { name: 'homeBackground', maxCount: 1 },
  { name: 'homePoster', maxCount: 1 },
  { name: 'designBackground', maxCount: 1 },
]), updateSettings);

export default router;



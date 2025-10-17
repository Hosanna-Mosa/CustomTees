import { Router } from 'express';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';
import { listUsers } from '../controllers/admin.controller.js';

const router = Router();

router.get('/users', protect, verifyAdmin, listUsers);

export default router;



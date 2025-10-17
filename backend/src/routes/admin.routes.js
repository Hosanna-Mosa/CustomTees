import { Router } from 'express';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';
import { listUsers, getStats, listOrders } from '../controllers/admin.controller.js';

const router = Router();

router.get('/users', protect, verifyAdmin, listUsers);
router.get('/stats', protect, verifyAdmin, getStats);
router.get('/orders', protect, verifyAdmin, listOrders);

export default router;



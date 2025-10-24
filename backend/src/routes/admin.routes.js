import { Router } from 'express';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';
import { listUsers, getStats, listOrders, listDesigns, updateOrderStatus } from '../controllers/admin.controller.js';

const router = Router();

router.get('/users',  listUsers);
router.get('/stats',  getStats);
router.get('/orders',  listOrders);
router.get('/designs',  listDesigns);
router.put('/orders/:id/status',  updateOrderStatus);

export default router;



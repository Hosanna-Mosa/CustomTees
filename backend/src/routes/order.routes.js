import { Router } from 'express';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';
import { createOrder, myOrders, listOrders, updateStatus } from '../controllers/order.controller.js';

const router = Router();

// user
router.post('/', protect, createOrder);
router.get('/mine', protect, myOrders);

// admin
router.get('/', protect, verifyAdmin, listOrders);
router.put('/:id/status', protect, verifyAdmin, updateStatus);

export default router;



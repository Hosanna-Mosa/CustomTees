import { Router } from 'express';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';
import { createOrder, myOrders, listOrders, updateStatus, createOrderFromCart, getOrderById } from '../controllers/order.controller.js';

const router = Router();

// user
router.post('/', protect, createOrder);
router.post('/from-cart', protect, createOrderFromCart);
router.get('/mine', protect, myOrders);

// admin
router.get('/', listOrders);
router.get('/:id',  getOrderById);
router.put('/:id/status', protect, verifyAdmin, updateStatus);

export default router;



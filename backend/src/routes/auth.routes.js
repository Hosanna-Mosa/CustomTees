import { Router } from 'express';
import { body } from 'express-validator';
import { signup, login, getProfile, updateProfile, addAddress, updateAddress, deleteAddress } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/signup', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], signup);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], login);

// Profile
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
// Addresses
router.post('/me/addresses', protect, addAddress);
router.put('/me/addresses/:id', protect, updateAddress);
router.delete('/me/addresses/:id', protect, deleteAddress);

export default router;



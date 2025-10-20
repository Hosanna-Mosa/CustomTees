import { Router } from 'express';
import { body } from 'express-validator';
import { signup, login, getProfile, updateProfile, addAddress, updateAddress, deleteAddress, forgotPassword, resetPassword, saveDesign, listDesigns, getDesignById } from '../controllers/auth.controller.js';
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

// Forgot password routes
router.post('/forgot-password', [
  body('email').isEmail(),
], forgotPassword);

router.post('/reset-password', [
  body('email').isEmail(),
  body('code').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 6 }),
], resetPassword);

// Profile
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
// Addresses
router.post('/me/addresses', protect, addAddress);
router.put('/me/addresses/:id', protect, updateAddress);
router.delete('/me/addresses/:id', protect, deleteAddress);

// Designs
router.get('/me/designs', protect, listDesigns);
router.post('/me/designs', protect, saveDesign);
router.get('/me/designs/:id', protect, getDesignById);

export default router;



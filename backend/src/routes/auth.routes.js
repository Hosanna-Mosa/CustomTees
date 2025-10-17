import { Router } from 'express';
import { body } from 'express-validator';
import { signup, login } from '../controllers/auth.controller.js';

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

export default router;



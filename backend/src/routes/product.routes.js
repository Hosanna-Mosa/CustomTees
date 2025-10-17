import { Router } from 'express';
import { body } from 'express-validator';
import { listProducts, getBySlug, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

router.get('/', listProducts);
router.get('/:slug', getBySlug);

router.post('/', protect, verifyAdmin, upload.array('images', 10), [
  body('name').notEmpty(),
  body('slug').notEmpty(),
  body('price').isNumeric(),
], createProduct);

router.put('/:id', protect, verifyAdmin, upload.array('images', 10), updateProduct);
router.delete('/:id', protect, verifyAdmin, deleteProduct);

export default router;



import { Router } from 'express';
import { body } from 'express-validator';
import {
  listProducts,
  getBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect, verifyAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

/**
 * @desc Get all products
 */
router.get('/', listProducts);

/**
 * @desc Get single product by slug
 */
router.get('/:slug', getBySlug);

/**
 * @desc Create new product (admin only)
 * Supports customizable products with optional design templates
 */
router.post(
  '/',
  protect,
  verifyAdmin,
  upload.array('images', 10),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
    body('price').isNumeric().withMessage('Price must be a number'),

    // 👇 New optional fields for customization
    body('customizable')
      .optional()
      .isBoolean()
      .withMessage('customizable must be a boolean'),
    body('customizationType')
      .optional()
      .isIn(['predefined', 'own', 'both'])
      .withMessage('Invalid customization type'),
    body('designTemplate')
      .optional()
      .custom((value) => {
        // Allow JSON strings or objects
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return true;
          } catch {
            throw new Error('designTemplate must be valid JSON');
          }
        }
        return true;
      }),
  ],
  createProduct
);

/**
 * @desc Update product (admin only)
 * Allows image upload/removal and design template updates
 */
router.put(
  '/:id',
  protect,
  verifyAdmin,
  upload.array('images', 10),
  [
    body('customizable')
      .optional()
      .isBoolean()
      .withMessage('customizable must be a boolean'),
    body('customizationType')
      .optional()
      .isIn(['predefined', 'own', 'both'])
      .withMessage('Invalid customization type'),
    body('designTemplate')
      .optional()
      .custom((value) => {
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return true;
          } catch {
            throw new Error('designTemplate must be valid JSON');
          }
        }
        return true;
      }),
  ],
  updateProduct
);

/**
 * @desc Delete product (admin only)
 */
router.delete('/:id', protect, verifyAdmin, deleteProduct);

export default router;

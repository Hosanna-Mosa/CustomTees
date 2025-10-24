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
 * @desc Create new product (Admin only)
 * Supports:
 *  - Variants (color → image mapping)
 *  - Customizable designs
 */
router.post(
  '/',
  upload.any(), // Accept any field names for dynamic image uploads
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
    body('price').isNumeric().withMessage('Price must be a number'),

    // ✅ New: Variants array
    body('variants')
      .optional()
      .custom((value) => {
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          if (!Array.isArray(parsed)) throw new Error();
          return true;
        } catch {
          throw new Error('variants must be a valid JSON array');
        }
      }),

    // ✅ Optional customization fields
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
  createProduct
);

/**
 * @desc Update existing product (Admin only)
 * Supports updating:
 *  - Variants (add/remove colors or images)
 *  - Design templates
 */
router.put(
  '/:id',
  upload.any(), // Accept any field names for dynamic image uploads
  [
    body('variants')
      .optional()
      .custom((value) => {
        try {
          const parsed = typeof value === 'string' ? JSON.parse(value) : value;
          if (!Array.isArray(parsed)) throw new Error();
          return true;
        } catch {
          throw new Error('variants must be a valid JSON array');
        }
      }),

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
 * @desc Delete product (Admin only)
 */
router.delete('/:id',deleteProduct);

export default router;

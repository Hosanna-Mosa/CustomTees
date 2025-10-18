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
  protect,
  verifyAdmin,
  // 💡 Use .fields() instead of .array() to accept multiple color-based image sets
  upload.fields([
    // Example keys:
    // { name: 'images_Red', maxCount: 10 },
    // { name: 'images_Black', maxCount: 10 },
    // You’ll dynamically send these from the frontend using FormData
  ]),
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
  protect,
  verifyAdmin,
  upload.fields([]), // same logic applies — frontend will dynamically send images_<color>
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
router.delete('/:id', protect, verifyAdmin, deleteProduct);

export default router;

import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { uploadImage, destroyImage } from '../services/cloudinary.service.js';

/* ============================================================
 🧩 List All Products
============================================================ */
export const listProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ success: true, data: products });
};

/* ============================================================
 🧩 Get Product by Slug
============================================================ */
export const getBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product)
    return res.status(404).json({ success: false, message: 'Product not found' });

  res.json({ success: true, data: product });
};

/* ============================================================
 🧩 Create Product (Supports Variants + Design Template)
============================================================ */
export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: errors.array(),
    });
  }

  try {
    const body = req.body;

    // 🧠 Parse variant data (color + images)
    // Expecting something like:
    // variants: '[{"color":"Red","colorCode":"#FF0000"},{"color":"Black"}]'
    let variants = [];
    if (body.variants) {
      try {
        variants =
          typeof body.variants === 'string'
            ? JSON.parse(body.variants)
            : body.variants;
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid variants JSON format',
        });
      }
    }

    // 🧩 Upload images from req.files and map them to variants
    // Frontend should send file field names like: images_Red_0, images_Black_1, etc.
    if (req.files && Object.keys(req.files).length) {
      for (const key of Object.keys(req.files)) {
        const match = key.match(/^images_(.+)$/); // extract color name
        if (match) {
          const color = match[1];
          const uploadedImages = [];
          for (const file of req.files[key]) {
            const img = await uploadImage(file.path);
            uploadedImages.push(img);
          }

          // Assign uploaded images to corresponding variant
          const variant = variants.find(
            (v) => v.color.toLowerCase() === color.toLowerCase()
          );
          if (variant) variant.images = uploadedImages;
        }
      }
    }

    // Validate at least one variant and one image
    if (!variants.length || variants.every((v) => !v.images?.length)) {
      return res.status(400).json({
        success: false,
        message: 'At least one variant with images is required',
      });
    }

    // 🧠 Handle design template if customization is enabled
    let designTemplate = null;
    if (body.customizable === 'true' || body.customizable === true) {
      if (body.designTemplate) {
        try {
          designTemplate =
            typeof body.designTemplate === 'string'
              ? JSON.parse(body.designTemplate)
              : body.designTemplate;
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: 'Invalid designTemplate format',
          });
        }
      }
    }

    // 🏷️ Create the product
    const product = await Product.create({
      ...body,
      variants,
      designTemplate,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ============================================================
 🧩 Update Product (Supports Variants + Design)
============================================================ */
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product)
    return res.status(404).json({ success: false, message: 'Product not found' });

  try {
    const body = req.body;

    // 🧠 Parse variants
    let variants = [];
    if (body.variants) {
      variants =
        typeof body.variants === 'string'
          ? JSON.parse(body.variants)
          : body.variants;
    }

    // 🧩 Handle new image uploads mapped to colors
    if (req.files && Object.keys(req.files).length) {
      for (const key of Object.keys(req.files)) {
        const match = key.match(/^images_(.+)$/);
        if (match) {
          const color = match[1];
          const uploadedImages = [];
          for (const file of req.files[key]) {
            const img = await uploadImage(file.path);
            uploadedImages.push(img);
          }

          const variant = variants.find(
            (v) => v.color.toLowerCase() === color.toLowerCase()
          );
          if (variant) {
            // Replace or merge images for that color
            const existing = product.variants.find(
              (v) => v.color.toLowerCase() === color.toLowerCase()
            );
            if (existing) {
              existing.images.push(...uploadedImages);
            } else {
              product.variants.push({ ...variant, images: uploadedImages });
            }
          }
        }
      }
    }

    // 🧹 Handle removed image public IDs
    if (body.removePublicIds) {
      const ids = Array.isArray(body.removePublicIds)
        ? body.removePublicIds
        : [body.removePublicIds];
      for (const variant of product.variants) {
        variant.images = variant.images.filter(
          (img) => !ids.includes(img.public_id)
        );
      }
      for (const pid of ids) await destroyImage(pid);
    }

    // 🧠 Handle design template update
    if (body.designTemplate) {
      try {
        product.designTemplate =
          typeof body.designTemplate === 'string'
            ? JSON.parse(body.designTemplate)
            : body.designTemplate;
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid designTemplate format' });
      }
    }

    // 🏷️ Merge other product fields
    Object.assign(product, {
      ...body,
      variants: variants.length ? variants : product.variants,
    });

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/* ============================================================
 🧩 Delete Product (Also remove Cloudinary images)
============================================================ */
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product)
    return res.status(404).json({ success: false, message: 'Product not found' });

  // 🧹 Delete all variant images
  for (const variant of product.variants) {
    for (const img of variant.images || []) {
      await destroyImage(img.public_id);
    }
  }

  await product.deleteOne();

  res.json({ success: true, message: 'Product deleted successfully' });
};

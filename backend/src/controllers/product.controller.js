import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { uploadImage, destroyImage } from '../services/cloudinary.service.js';

// 🧩 Get all products
export const listProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ success: true, data: products });
};

// 🧩 Get single product by slug
export const getBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product)
    return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

// 🧩 Create new product (with optional design template)
export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res
      .status(400)
      .json({ success: false, message: 'Validation error', details: errors.array() });

  try {
    const body = req.body;
    const images = [];

    // Upload images to Cloudinary
    if (req.files?.length) {
      for (const file of req.files) {
        const img = await uploadImage(file.path);
        images.push(img);
      }
    }

    if (images.length === 0)
      return res
        .status(400)
        .json({ success: false, message: 'At least one image is required' });

    // 🧠 Handle design template data if customization is enabled
    let designTemplate = null;
    if (body.customizable === 'true' || body.customizable === true) {
      try {
        if (body.designTemplate) {
          // Parse if JSON string is sent from frontend
          designTemplate =
            typeof body.designTemplate === 'string'
              ? JSON.parse(body.designTemplate)
              : body.designTemplate;
        }
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid designTemplate format' });
      }
    }

    // 🧩 Create new product document
    const product = await Product.create({
      ...body,
      images,
      designTemplate,
    });

    res
      .status(201)
      .json({ success: true, message: 'Product created successfully', data: product });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 🧩 Update existing product (with design template support)
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product)
    return res.status(404).json({ success: false, message: 'Product not found' });

  const body = req.body;

  // Handle removed images
  if (req.body.removePublicIds) {
    const ids = Array.isArray(req.body.removePublicIds)
      ? req.body.removePublicIds
      : [req.body.removePublicIds];
    product.images = product.images.filter((img) => !ids.includes(img.public_id));
    for (const pid of ids) await destroyImage(pid);
  }

  // Handle new image uploads
  if (req.files?.length) {
    for (const file of req.files) {
      const img = await uploadImage(file.path);
      product.images.push(img);
    }
  }

  // 🧠 Handle design template updates
  if (body.designTemplate) {
    try {
      const designData =
        typeof body.designTemplate === 'string'
          ? JSON.parse(body.designTemplate)
          : body.designTemplate;
      product.designTemplate = designData;
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid designTemplate format' });
    }
  }

  // Merge rest of the body
  Object.assign(product, body);

  await product.save();

  res.json({ success: true, message: 'Product updated successfully', data: product });
};

// 🧩 Delete product (also remove images)
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product)
    return res.status(404).json({ success: false, message: 'Product not found' });

  // Delete all product images from Cloudinary
  for (const img of product.images) await destroyImage(img.public_id);

  await product.deleteOne();

  res.json({ success: true, message: 'Product deleted successfully' });
};

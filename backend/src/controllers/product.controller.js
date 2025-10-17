import { validationResult } from 'express-validator';
import Product from '../models/Product.js';
import { uploadImage, destroyImage } from '../services/cloudinary.service.js';

export const listProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ success: true, data: products });
};

export const getBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product });
};

export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation error', details: errors.array() });
  try {
    const body = req.body;
    const images = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const img = await uploadImage(file.path);
        images.push(img);
      }
    }
    if (images.length === 0) return res.status(400).json({ success: false, message: 'At least one image is required' });
    const product = await Product.create({ ...body, images });
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const body = req.body;
  if (req.body.removePublicIds) {
    const ids = Array.isArray(req.body.removePublicIds) ? req.body.removePublicIds : [req.body.removePublicIds];
    product.images = product.images.filter((img) => !ids.includes(img.public_id));
    for (const pid of ids) await destroyImage(pid);
  }
  if (req.files?.length) {
    for (const file of req.files) {
      const img = await uploadImage(file.path);
      product.images.push(img);
    }
  }
  Object.assign(product, body);
  await product.save();
  res.json({ success: true, message: 'Product updated', data: product });
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  for (const img of product.images) await destroyImage(img.public_id);
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
};



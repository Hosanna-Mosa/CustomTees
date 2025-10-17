import Order from '../models/Order.js';
import Product from '../models/Product.js';

export const createOrder = async (req, res) => {
  const { productId, quantity = 1, paymentMethod, shippingAddress } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const item = { product: product._id, quantity, price: product.price };
  const total = product.price * quantity;
  const order = await Order.create({
    user: req.user._id,
    items: [item],
    total,
    paymentMethod,
    shippingAddress,
  });
  res.status(201).json({ success: true, data: order });
};

export const myOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product').sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
};

export const listOrders = async (_req, res) => {
  const orders = await Order.find().populate('user', 'name email').populate('items.product').sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  order.status = status || order.status;
  await order.save();
  res.json({ success: true, data: order });
};



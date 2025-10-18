import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

export const listUsers = async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
};

export const getStats = async (req, res) => {
  const [users, products] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
  ]);
  // Placeholder orders count until orders model is added
  const orders = 0;
  res.json({ success: true, data: { users, products, orders } });
};

export const listOrders = async (_req, res) => {
  const orders = await Order.find().populate('user', 'name email').populate('items.product').sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
};



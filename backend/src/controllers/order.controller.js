import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

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

export const createOrderFromCart = async (req, res) => {
  try {
    const { paymentMethod, shippingAddress } = req.body;
    
    // Get user with cart
    const user = await User.findById(req.user._id);
    if (!user || !user.cart.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Convert cart items to order items
    const orderItems = user.cart.map(cartItem => {
      console.log('Cart item being converted:', cartItem);
      console.log('Front design preview:', cartItem.frontDesign?.previewImage);
      console.log('Back design preview:', cartItem.backDesign?.previewImage);
      
      return {
        product: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.totalPrice,
        // Store custom design data
        customDesign: {
          frontDesign: cartItem.frontDesign,
          backDesign: cartItem.backDesign,
          selectedColor: cartItem.selectedColor,
          selectedSize: cartItem.selectedSize,
        }
      };
    });
    
    // Calculate total
    const total = user.cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
    
    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total,
      paymentMethod,
      shippingAddress,
    });
    
    console.log('Order created:', JSON.stringify(order, null, 2));
    console.log('Order items:', order.items);
    
    // Clear user's cart after successful order
    user.cart = [];
    await user.save();
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

export const myOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate('items.product').sort({ createdAt: -1 });
  console.log('Orders being returned:', JSON.stringify(orders, null, 2));
  res.json({ success: true, data: orders });
};

export const listOrders = async (_req, res) => {
  const orders = await Order.find().populate('user', 'name email').populate('items.product').sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name slug price variants');
  
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  
  res.json({ success: true, data: order });
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



import mongoose from 'mongoose';
import Design from '../models/Design.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Create database indexes for better performance
export const createIndexes = async () => {
  try {
    console.log('Creating database indexes...');
    
    // Design collection indexes
    await Design.collection.createIndex({ createdAt: -1 });
    await Design.collection.createIndex({ user: 1 });
    await Design.collection.createIndex({ productId: 1 });
    await Design.collection.createIndex({ 'frontDesign.previewImage': 1 });
    await Design.collection.createIndex({ 'backDesign.previewImage': 1 });
    
    // User collection indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: -1 });
    
    // Product collection indexes
    await Product.collection.createIndex({ slug: 1 }, { unique: true });
    await Product.collection.createIndex({ createdAt: -1 });
    await Product.collection.createIndex({ customizable: 1 });
    
    // Order collection indexes
    await Order.collection.createIndex({ createdAt: -1 });
    await Order.collection.createIndex({ user: 1 });
    await Order.collection.createIndex({ status: 1 });
    
    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

// Drop all indexes (use with caution)
export const dropIndexes = async () => {
  try {
    console.log('Dropping all indexes...');
    
    await Design.collection.dropIndexes();
    await User.collection.dropIndexes();
    await Product.collection.dropIndexes();
    await Order.collection.dropIndexes();
    
    console.log('All indexes dropped');
  } catch (error) {
    console.error('Error dropping indexes:', error);
  }
};

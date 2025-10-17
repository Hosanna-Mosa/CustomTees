import dotenv from 'dotenv';
import mongoose from 'mongoose';
import slugify from 'slugify';
import connectDB from '../src/config/db.js';
import Product from '../src/models/Product.js';
import { configureCloudinary } from '../src/services/cloudinary.service.js';

dotenv.config();
await connectDB();
configureCloudinary();

const PLACEHOLDER = (i) => ({ url: `https://res.cloudinary.com/demo/image/upload/sample_${i}.jpg`, public_id: `placeholder/sample_${i}` });

const base = [
  { name: 'Classic T-Shirt', description: 'Soft cotton tee', price: 599, stock: 100 },
  { name: 'Premium Hoodie', description: 'Warm and comfy', price: 2499, stock: 50 },
  { name: 'Polo Shirt', description: 'Smart casual polo', price: 1299, stock: 70 },
  { name: 'Baseball Cap', description: 'Adjustable cap', price: 799, stock: 200 },
  { name: 'Crewneck Sweatshirt', description: 'Everyday comfort', price: 1999, stock: 60 },
];

try {
  await Product.deleteMany({});
  const docs = [];
  for (let i = 0; i < base.length; i++) {
    const p = base[i];
    const slug = slugify(p.name, { lower: true });
    const images = [PLACEHOLDER(i + 1)];
    docs.push({ ...p, slug, images });
  }
  await Product.insertMany(docs);
  console.log('Seeded 5 products');
} catch (e) {
  console.error(e);
}

await mongoose.disconnect();
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import slugify from 'slugify';
import connectDB from '../src/config/db.js';
import Product from '../src/models/Product.js';
import { configureCloudinary } from '../src/services/cloudinary.service.js';

dotenv.config();
await connectDB();
configureCloudinary();

// Helper function to create image object
const createImage = (url, publicId) => ({
  url,
  public_id: publicId,
});

// Helper function to create variant with front and back images
const createVariant = (color, colorCode, frontUrl, frontPublicId, backUrl, backPublicId) => ({
  color,
  colorCode,
  images: [
    createImage(frontUrl, frontPublicId),
    createImage(backUrl, backPublicId),
  ],
});

// Product seed data
const products = [
  {
    name: 'Classic T-Shirt',
    description: 'Premium cotton t-shirt with comfortable fit. Perfect for everyday wear and custom designs.',
    price: 599,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    stock: 100,
    customizable: true,
    customizationType: 'both',
    variants: [
      createVariant(
        'White',
        '#FFFFFF',
        'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-white_ihnkka.jpg',
        't-shirt-white_ihnkka',
        'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-white-back_htuzus.jpg',
        't-shirt-white-back_htuzus'
      ),
      createVariant(
        'Black',
        '#000000',
        'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-black_bubnp1.jpg',
        't-shirt-black_bubnp1',
        'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723769/t-shirt-black-back_cjkf7a.jpg',
        't-shirt-black-back_cjkf7a'
      ),
    ],
    designTemplate: {
      type: 'predefined',
      layers: [],
      canvasSize: {
        width: 500,
        height: 500,
      },
      totalCost: 0,
    },
    customizationPricing: {
      perTextLayer: 10,
      perImageLayer: 20,
      sizeMultiplier: 0.1,
    },
  },
  // {
  //   name: 'Premium Hoodie',
  //   description: 'Warm and cozy hoodie with soft fleece lining. Ideal for cooler weather and custom designs.',
  //   price: 2499,
  //   sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  //   stock: 50,
  //   customizable: true,
  //   customizationType: 'both',
  //   variants: [
  //     createVariant(
  //       'White',
  //       '#FFFFFF',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-white_ihnkka.jpg',
  //       't-shirt-white_ihnkka',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-white-back_htuzus.jpg',
  //       't-shirt-white-back_htuzus'
  //     ),
  //     createVariant(
  //       'Black',
  //       '#000000',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-black_bubnp1.jpg',
  //       't-shirt-black_bubnp1',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723769/t-shirt-black-back_cjkf7a.jpg',
  //       't-shirt-black-back_cjkf7a'
  //     ),
  //   ],
  //   designTemplate: {
  //     type: 'predefined',
  //     layers: [],
  //     canvasSize: {
  //       width: 500,
  //       height: 500,
  //     },
  //     totalCost: 0,
  //   },
  //   customizationPricing: {
  //     perTextLayer: 15,
  //     perImageLayer: 25,
  //     sizeMultiplier: 0.15,
  //   },
  // },
  // {
  //   name: 'Polo Shirt',
  //   description: 'Smart casual polo shirt with classic collar. Perfect for business casual or weekend wear.',
  //   price: 1299,
  //   sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  //   stock: 70,
  //   customizable: true,
  //   customizationType: 'both',
  //   variants: [
  //     createVariant(
  //       'White',
  //       '#FFFFFF',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-white_ihnkka.jpg',
  //       't-shirt-white_ihnkka',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-white-back_htuzus.jpg',
  //       't-shirt-white-back_htuzus'
  //     ),
  //     createVariant(
  //       'Black',
  //       '#000000',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-black_bubnp1.jpg',
  //       't-shirt-black_bubnp1',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723769/t-shirt-black-back_cjkf7a.jpg',
  //       't-shirt-black-back_cjkf7a'
  //     ),
  //   ],
  //   designTemplate: {
  //     type: 'predefined',
  //     layers: [],
  //     canvasSize: {
  //       width: 500,
  //       height: 500,
  //     },
  //     totalCost: 0,
  //   },
  //   customizationPricing: {
  //     perTextLayer: 12,
  //     perImageLayer: 22,
  //     sizeMultiplier: 0.12,
  //   },
  // },
  // {
  //   name: 'Crewneck Sweatshirt',
  //   description: 'Everyday comfort sweatshirt with ribbed cuffs and hem. Great for layering.',
  //   price: 1999,
  //   sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  //   stock: 60,
  //   customizable: true,
  //   customizationType: 'both',
  //   variants: [
  //     createVariant(
  //       'White',
  //       '#FFFFFF',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-white_ihnkka.jpg',
  //       't-shirt-white_ihnkka',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-white-back_htuzus.jpg',
  //       't-shirt-white-back_htuzus'
  //     ),
  //     createVariant(
  //       'Black',
  //       '#000000',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723768/t-shirt-black_bubnp1.jpg',
  //       't-shirt-black_bubnp1',
  //       'https://res.cloudinary.com/dc3mzeh8i/image/upload/v1760723769/t-shirt-black-back_cjkf7a.jpg',
  //       't-shirt-black-back_cjkf7a'
  //     ),
  //   ],
  //   designTemplate: {
  //     type: 'predefined',
  //     layers: [],
  //     canvasSize: {
  //       width: 500,
  //       height: 500,
  //     },
  //     totalCost: 0,
  //   },
  //   customizationPricing: {
  //     perTextLayer: 12,
  //     perImageLayer: 22,
  //     sizeMultiplier: 0.12,
  //   },
  // },
];

try {
  await Product.deleteMany({});
  console.log('Cleared existing products...');

  const docs = products.map((product) => ({
    ...product,
    slug: slugify(product.name, { lower: true }),
  }));

  await Product.insertMany(docs);
  console.log(`✅ Seeded ${docs.length} products successfully!`);
  console.log(`   - Each product has ${products[0].variants.length} color variants`);
  console.log(`   - Each variant has front and back images`);
} catch (e) {
  console.error('❌ Error seeding products:', e);
}

await mongoose.disconnect();
console.log('Database connection closed.');

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import slugify from 'slugify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/db.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/services/auth.service.js';
import { configureCloudinary, uploadImage } from '../src/services/cloudinary.service.js';

dotenv.config();
await connectDB();
configureCloudinary();

// Get current directory for file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * T-shirt Image File Structure:
 * The T-shirts folder should contain images with the following naming convention:
 * - T-shirt-White-front.jpg
 * - T-shirt-White-back.jpg
 * - T-shirt-Black-front.jpg
 * - T-shirt-Black-back.jpg
 * - T-shirt-Navy-front.jpg
 * - T-shirt-Navy-back.jpg
 * etc.
 * 
 * Supported file extensions: .jpg, .jpeg, .png, .webp
 */

// Helper function to upload T-shirt image to Cloudinary
const uploadTShirtImage = async (colorName, type = 'general') => {
  const basePath = path.join(__dirname, 'T-shirts');
  const fileName = `t-shirt-${colorName}-${type}`;
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  // Try to find the image file with different extensions
  let imagePath = null;
  for (const ext of extensions) {
    const fullPath = path.join(basePath, `${fileName}${ext}`);
    if (fs.existsSync(fullPath)) {
      imagePath = fullPath;
      break;
    }
  }
  
  if (!imagePath) {
    console.warn(`⚠️  Image not found: ${fileName} (tried extensions: ${extensions.join(', ')})`);
    // Return a placeholder if image doesn't exist
    return {
      url: `https://via.placeholder.com/400x400/cccccc/666666?text=${colorName}+${type}`,
      public_id: `tshirts/${colorName}_${type}_placeholder`
    };
  }
  
  try {
    console.log(`☁️  Uploading ${fileName} to Cloudinary...`);
    const result = await uploadImage(imagePath);
    console.log(`✅ Uploaded ${fileName} successfully`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName}:`, error.message);
    // Return placeholder on upload failure
    return {
      url: `https://via.placeholder.com/400x400/cccccc/666666?text=${colorName}+${type}`,
      public_id: `tshirts/${colorName}_${type}_error`
    };
  }
};

// Helper function to create color variants with uploaded T-shirt images
const createVariant = async (color, colorCode) => {
  const colorName = color.replace(/\s+/g, ''); // Remove spaces for filename
  
  // Upload front and back images to Cloudinary
  const frontImage = await uploadTShirtImage(colorName, 'front');
  const backImage = await uploadTShirtImage(colorName, 'back');
  
  return {
    color,
    colorCode,
    images: [frontImage, backImage],
    frontImages: [frontImage],
    backImages: [backImage]
  };
};

// Helper function to upload logo and preview images
const uploadLogoImage = async () => {
  const logoPath = path.join(__dirname, 'T-shirts', 'logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      console.log('☁️  Uploading logo to Cloudinary...');
      const result = await uploadImage(logoPath);
      console.log('✅ Logo uploaded successfully');
      return result.url;
    } catch (error) {
      console.error('❌ Failed to upload logo:', error.message);
      return 'https://via.placeholder.com/100x100/cccccc/666666?text=LOGO';
    }
  }
  console.warn('⚠️  Logo file not found, using placeholder');
  return 'https://via.placeholder.com/100x100/cccccc/666666?text=LOGO';
};

const uploadPreviewImage = async () => {
  const previewPath = path.join(__dirname, 't-shirts', 'preview-tshirt.jpg');
  if (fs.existsSync(previewPath)) {
    try {
      console.log('☁️  Uploading preview image to Cloudinary...');
      const result = await uploadImage(previewPath);
      console.log('✅ Preview image uploaded successfully');
      return result.url;
    } catch (error) {
      console.error('❌ Failed to upload preview image:', error.message);
      return 'https://via.placeholder.com/500x500/cccccc/666666?text=PREVIEW';
    }
  }
  console.warn('⚠️  Preview file not found, using placeholder');
  return 'https://via.placeholder.com/500x500/cccccc/666666?text=PREVIEW';
};

// Function to log expected image files for verification
const logExpectedImages = (variants) => {
  console.log('\n📁 Expected T-shirt image files:');
  variants.forEach(variant => {
    const colorName = variant.color.replace(/\s+/g, '');
    console.log(`  - T-shirt-${colorName}-front.jpg`);
    console.log(`  - T-shirt-${colorName}-back.jpg`);
  });
  console.log('  - logo.png (for design templates)');
  console.log('  - preview-tshirt.jpg (for design previews)\n');
};

// Helper function to create design layers
const createTextLayer = (content, x, y, options = {}) => ({
  layerType: 'text',
  position: { x, y },
  rotation: options.rotation || 0,
  scale: options.scale || 1,
  zIndex: options.zIndex || 0,
  properties: {
    content,
    fontFamily: options.fontFamily || 'Arial',
    fontSize: options.fontSize || 24,
    fontWeight: options.fontWeight || 'normal',
    color: options.color || '#000000',
    textAlign: options.textAlign || 'center',
    cost: options.cost || 0
  }
});

const createImageLayer = (imageUrl, x, y, options = {}) => ({
  layerType: 'image',
  position: { x, y },
  rotation: options.rotation || 0,
  scale: options.scale || 1,
  zIndex: options.zIndex || 0,
  properties: {
    imageUrl,
    opacity: options.opacity || 1,
    cost: options.cost || 20
  }
});

const prettifyColorName = (input) => {
  if (!input) return '';
  return input
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const generateColorCode = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${'000000'.substring(0, 6 - color.length)}${color}`;
};

const loadVariantsFromUploads = async (subFolder) => {
  const folderPath = path.join(__dirname, 'uploads', subFolder);
  if (!fs.existsSync(folderPath)) {
    console.warn(`⚠️  Uploads folder not found for ${subFolder}`);
    return [];
  }

  const files = fs.readdirSync(folderPath).filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));
  const variantsMap = new Map();

  for (const fileName of files) {
    const baseName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const lowerName = baseName.toLowerCase();

    let side = null;
    let colorPart = baseName;

    const frontIdx = lowerName.indexOf('front');
    const backIdx = lowerName.indexOf('back');

    if (frontIdx !== -1) {
      side = 'front';
      colorPart = baseName.slice(0, frontIdx);
    } else if (backIdx !== -1) {
      side = 'back';
      colorPart = baseName.slice(0, backIdx);
    } else {
      console.warn(`⚠️  Unable to determine side (front/back) for ${fileName}. Skipping.`);
      continue;
    }

    colorPart = colorPart.replace(/^kids[-_]/i, '').replace(/[-_]+$/g, '');
    const colorKey = colorPart.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const displayName = prettifyColorName(colorPart);

    if (!colorKey) {
      console.warn(`⚠️  Invalid color name parsed from ${fileName}. Skipping.`);
      continue;
    }

    const filePath = path.join(folderPath, fileName);
    console.log(`☁️  Uploading kids variant image: ${fileName}`);
    const uploaded = await uploadImage(filePath);

    if (!variantsMap.has(colorKey)) {
      variantsMap.set(colorKey, {
        color: displayName,
        colorCode: generateColorCode(colorKey),
        images: [],
        frontImages: [],
        backImages: []
      });
    }

    const variant = variantsMap.get(colorKey);
    variant.images.push(uploaded);
    if (side === 'front') {
      variant.frontImages.push(uploaded);
    } else {
      variant.backImages.push(uploaded);
    }
  }

  return Array.from(variantsMap.values());
};

// Function to create sample products with uploaded images
const createSampleProducts = async () => {
  console.log('🎨 Creating sample products with Cloudinary uploads...');
  
  // Upload logo and preview images first
  const logoUrl = await uploadLogoImage();
  const previewUrl = await uploadPreviewImage();
  
  // Create variants with uploaded images
  const adultVariants = await Promise.all([
    
    createVariant('red', '#DC2626'),
    createVariant('sport-grey', '#6B7280'),
    createVariant('stone-blue', '#2563EB'),
    createVariant('safety-green', '#16A34A'),

  ]);

  const products = [
    {
      name: 'Classic Cotton T-Shirt',
      description: 'Soft, comfortable 100% cotton t-shirt perfect for everyday wear. Pre-shrunk and machine washable.',
      price: 2499, // $24.99
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      stock: 100,
      customizable: true,
      customizationType: 'both',
      variants: adultVariants,
      designTemplate: {
        type: 'predefined',
        layers: [
          createTextLayer('CUSTOM TEE', 250, 200, { 
            fontSize: 32, 
            fontWeight: 'bold', 
            color: '#000000',
            zIndex: 1 
          }),
          createImageLayer(logoUrl, 250, 250, {
            scale: 0.8,
            zIndex: 2
          })
        ],
        canvasSize: { width: 500, height: 500 },
        previewUrl,
        totalCost: 20
      },
      customizationPricing: {
        perTextLayer: 5,
        perImageLayer: 15,
        sizeMultiplier: 0.1
      }
    }
  ];

  const kidsVariants = await loadVariantsFromUploads('kids');
  if (kidsVariants.length) {
    products.push({
      name: 'Kids T-Shirts',
      description: 'Bright, durable tees sized perfectly for kids. Double-stitched seams and vibrant colors to withstand everyday adventures.',
      price: 1499,
      sizes: ['XS', 'S', 'M', 'L'],
      stock: 80,
      customizable: true,
      customizationType: 'both',
      variants: kidsVariants
    });
    console.log(`👕 Added ${kidsVariants.length} kids variants from uploads/kids`);
  } else {
    console.warn('⚠️  No kids variants found to seed.');
  }
  
  return products;
};

try {
  // Clear existing data
  await Promise.all([
    Product.deleteMany({}), 
    User.deleteMany({ role: 'admin' })
  ]);
  
  console.log('🗑️  Cleared existing data...');
  
  // Create sample products with uploaded images
  const sampleProducts = await createSampleProducts();
  
  // Log expected image files for the first product (T-shirt)
  if (sampleProducts.length > 0) {
    logExpectedImages(sampleProducts[0].variants);
  }
  
  // Create products with slugs
  const products = [];
  for (const productData of sampleProducts) {
    const slug = slugify(productData.name, { lower: true });
    products.push({ ...productData, slug });
  }
  
  // Insert products
  const createdProducts = await Product.insertMany(products);
  console.log(`✅ Seeded ${createdProducts.length} products with Cloudinary images`);
  
  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@customtees.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const hashed = await hashPassword(adminPass);
  
  await User.create({ 
    name: 'Admin User', 
    email: adminEmail, 
    password: hashed, 
    role: 'admin' 
  });
  
  console.log(`👤 Admin user created: ${adminEmail} / ${adminPass}`);
  
  // Display summary
  console.log('\n📊 Seeding Summary:');
  console.log(`- Products: ${createdProducts.length}`);
  console.log(`- Total variants: ${createdProducts.reduce((sum, p) => sum + p.variants.length, 0)}`);
  console.log(`- Total images uploaded to Cloudinary: ${createdProducts.reduce((sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.images.length, 0), 0)}`);
  console.log(`- Customizable products: ${createdProducts.filter(p => p.customizable).length}`);
  console.log(`- Admin user: ${adminEmail}`);
  console.log('☁️  All images have been uploaded to Cloudinary and URLs stored in database');
  
} catch (error) {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
}

await mongoose.disconnect();
console.log('🔌 Database connection closed');
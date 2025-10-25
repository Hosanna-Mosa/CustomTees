
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
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  // Try multiple naming patterns to handle file naming inconsistencies
  const possibleFileNames = [
    `t-shirt-${colorName}-${type}`,  // Standard format: t-shirt-kiwi-front
    `t-shirt-${colorName}${type}`,   // Missing hyphen: t-shirt-Kiwifront
    `t-shirt-${colorName.replace(/-/g, ' ')}-${type}`, // With spaces: t-shirt-Blue Dusk-front
    `t-shirt-${colorName.replace(/-/g, ' ')}${type}`,  // With spaces, no hyphen: t-shirt-Blue Duskfront
  ];
  
  // Try to find the image file with different naming patterns and extensions
  let imagePath = null;
  for (const fileName of possibleFileNames) {
    for (const ext of extensions) {
      const fullPath = path.join(basePath, `${fileName}${ext}`);
      if (fs.existsSync(fullPath)) {
        imagePath = fullPath;
        break;
      }
    }
    if (imagePath) break;
  }
  
  if (!imagePath) {
    console.warn(`⚠️  Image not found for ${colorName} ${type} (tried patterns: ${possibleFileNames.join(', ')})`);
    // Return a placeholder if image doesn't exist
    return {
      url: `https://via.placeholder.com/400x400/cccccc/666666?text=${colorName}+${type}`,
      public_id: `tshirts/${colorName}_${type}_placeholder`
    };
  }
  
  try {
    console.log(`☁️  Uploading ${path.basename(imagePath)} to Cloudinary...`);
    const result = await uploadImage(imagePath);
    console.log(`✅ Uploaded ${path.basename(imagePath)} successfully`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload ${path.basename(imagePath)}:`, error.message);
    // Return placeholder on upload failure
    return {
      url: `https://via.placeholder.com/400x400/cccccc/666666?text=${colorName}+${type}`,
      public_id: `tshirts/${colorName}_${type}_error`
    };
  }
};

// Helper function to upload Hoodie image to Cloudinary
const uploadHoodieImage = async (colorName, type = 'general') => {
  const basePath = path.join(__dirname, 'hoodies');
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  // Try multiple naming patterns to handle file naming inconsistencies
  const possibleFileNames = [
    `hodded-${colorName}-${type}`,  // Standard format: hodded-black-front
    `hodded-${colorName.replace(/-/g, '_')}-${type}`, // With underscores: hodded-Dark_chocolate-front
    `hodded-${colorName.replace(/-/g, ' ')}-${type}`, // With spaces: hodded-Antique cherry red-front
    `hodded-${colorName.replace(/-/g, ' ')}${type}`,  // With spaces, no hyphen: hodded-Antique cherry redfront
  ];
  
  // Try to find the image file with different naming patterns and extensions
  let imagePath = null;
  for (const fileName of possibleFileNames) {
    for (const ext of extensions) {
      const fullPath = path.join(basePath, `${fileName}${ext}`);
      if (fs.existsSync(fullPath)) {
        imagePath = fullPath;
        break;
      }
    }
    if (imagePath) break;
  }
  
  if (!imagePath) {
    console.warn(`⚠️  Hoodie image not found for ${colorName} ${type} (tried patterns: ${possibleFileNames.join(', ')})`);
    // Return a placeholder if image doesn't exist
    return {
      url: `https://via.placeholder.com/400x400/cccccc/666666?text=${colorName}+${type}`,
      public_id: `hoodies/${colorName}_${type}_placeholder`
    };
  }
  
  try {
    console.log(`☁️  Uploading hoodie ${path.basename(imagePath)} to Cloudinary...`);
    const result = await uploadImage(imagePath);
    console.log(`✅ Uploaded hoodie ${path.basename(imagePath)} successfully`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to upload hoodie ${path.basename(imagePath)}:`, error.message);
    // Return placeholder on upload failure
    return {
      url: `https://via.placeholder.com/400x400/cccccc/666666?text=${colorName}+${type}`,
      public_id: `hoodies/${colorName}_${type}_error`
    };
  }
};

// Helper function to create color variants with uploaded T-shirt images
const createVariant = async (color, colorCode) => {
  // Convert color name to match file naming convention (lowercase with hyphens)
  const colorName = color.toLowerCase().replace(/\s+/g, '-');
  
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

// Helper function to create hoodie color variants with uploaded images
const createHoodieVariant = async (color, colorCode) => {
  // Convert color name to match file naming convention (lowercase with hyphens)
  const colorName = color.toLowerCase().replace(/\s+/g, '-');
  
  // Upload front and back images to Cloudinary
  const frontImage = await uploadHoodieImage(colorName, 'front');
  const backImage = await uploadHoodieImage(colorName, 'back');
  
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

// Function to create sample products with uploaded images
const createSampleProducts = async () => {
  console.log('🎨 Creating sample products with Cloudinary uploads...');
  
  // Upload logo and preview images first
  const logoUrl = await uploadLogoImage();
  const previewUrl = await uploadPreviewImage();
  
  // Create variants with uploaded images - All available t-shirt colors
  const variants = await Promise.all([
    createVariant('antique cherry red', '#8B0000'),
    createVariant('antique irish green', '#4B5320'),
    createVariant('antique royal', '#4169E1'),
    createVariant('ash', '#B2BEB5'),
    createVariant('Azalea', '#F7CAC9'),
    createVariant('Blue Dusk', '#2E4A62'),
    createVariant('cardinal-red', '#C41E3A'),
    createVariant('carolinal-blue', '#4B0082'),
    createVariant('charcole', '#36454F'),
    createVariant('cherry-red', '#DE3163'),
    createVariant('cornsilk', '#FFF8DC'),
    createVariant('Daisy', '#FFD700'),
    createVariant('Dark-chocolate', '#3C2415'),
    createVariant('Forest', '#228B22'),
    createVariant('Galapagos-blue', '#1E90FF'),
    createVariant('Gold', '#FFD700'),
    createVariant('Heather-cardinal', '#C41E3A'),
    createVariant('Heather-indigo', '#4B0082'),
    createVariant('Heather-Navy', '#000080'),
    createVariant('Heather-sapphire', '#0F52BA'),
    createVariant('Heliconia', '#FF6B6B'),
    createVariant('Ice-Grey', '#B0B0B0'),
    createVariant('Indigo-Blue', '#4B0082'),
    createVariant('Iris', '#5D4E75'),
    createVariant('Irish-green', '#40E0D0'),
    createVariant('Jade-Dome', '#00A86B'),
    createVariant('Kelly', '#4CBB17'),
    createVariant('Kiwi', '#8FBC8F'),
    createVariant('Light-blue', '#ADD8E6'),
    createVariant('Light-pink', '#FFB6C1'),
    createVariant('Lime', '#32CD32'),
    createVariant('Maroon', '#800000'),
    createVariant('Metro-blue', '#1E3A8A'),
    createVariant('Militry-green', '#355E3B'),
    createVariant('Mint-green', '#98FB98'),
    createVariant('Natural', '#F5F5DC'),
    createVariant('Navy', '#000080'),
    createVariant('Olive', '#808000'),
    createVariant('Orange', '#FFA500'),
    createVariant('Orchid', '#DA70D6'),
    createVariant('pfd-white', '#FFFFFF'),
    createVariant('pistachio', '#93C572'),
    createVariant('prairie-dust', '#D2B48C'),
    createVariant('purple', '#800080'),
    createVariant('red', '#DC2626'),
    createVariant('royal', '#4169E1'),
    createVariant('safety-green', '#16A34A'),
    createVariant('safety-orange', '#FF8C00'),
    createVariant('safety-pink', '#FF69B4'),
    createVariant('sand', '#F4A460'),
    createVariant('sapphire', '#0F52BA'),
    createVariant('sky', '#87CEEB'),
    createVariant('sport-grey', '#6B7280'),
    createVariant('stone-blue', '#2563EB'),
    createVariant('tan', '#D2B48C'),
    createVariant('tangerine', '#F28500'),
    createVariant('texas-orange', '#FF4500'),
    createVariant('vegas-gold', '#FFD700'),
  ]);
  
  return [
    {
      name: 'Classic Cotton T-Shirt',
      description: 'Soft, comfortable 100% cotton t-shirt perfect for everyday wear. Pre-shrunk and machine washable.',
      price: 2499, // $24.99
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      stock: 100,
      customizable: true,
      customizationType: 'both',
      variants,
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
};

// Function to create hoodie products with uploaded images
const createHoodieProducts = async () => {
  console.log('🎨 Creating hoodie products with Cloudinary uploads...');
  
  // Upload logo and preview images first
  const logoUrl = await uploadLogoImage();
  const previewUrl = await uploadPreviewImage();
  
  // Create hoodie variants with uploaded images - All available hoodie colors
  const hoodieVariants = await Promise.all([
    createHoodieVariant('Antique cherry red', '#8B0000'),
    createHoodieVariant('Antique sapphire', '#0F52BA'),
    createHoodieVariant('Ash', '#B2BEB5'),
    createHoodieVariant('Azalea', '#F7CAC9'),
    createHoodieVariant('black', '#000000'),
    createHoodieVariant('Cardinal red', '#C41E3A'),
    createHoodieVariant('Carolina blue', '#4B0082'),
    createHoodieVariant('Charcoal', '#36454F'),
    createHoodieVariant('Cherry red', '#DE3163'),
    createHoodieVariant('Dark chocolate', '#3C2415'),
    createHoodieVariant('Dark Heather', '#696969'),
    createHoodieVariant('Forest', '#228B22'),
    createHoodieVariant('Garnet', '#800020'),
    createHoodieVariant('Gold', '#FFD700'),
    createHoodieVariant('Graphite Heather', '#4A4A4A'),
    createHoodieVariant('Heather dark green', '#355E3B'),
    createHoodieVariant('Heather dark Maroon', '#800000'),
    createHoodieVariant('Heather dark Navy', '#000080'),
    createHoodieVariant('Heather dark Royal', '#4169E1'),
    createHoodieVariant('Heather Scarlet Red', '#DC143C'),
    createHoodieVariant('Heliconia', '#FF6B6B'),
    createHoodieVariant('indigo blue', '#4B0082'),
    createHoodieVariant('Irish Green', '#40E0D0'),
    createHoodieVariant('light Blue', '#ADD8E6'),
    createHoodieVariant('light Pink', '#FFB6C1'),
    createHoodieVariant('Maroon', '#800000'),
    createHoodieVariant('Military Greeen', '#355E3B'),
    createHoodieVariant('Mint Greeen', '#98FB98'),
    createHoodieVariant('Navy', '#000080'),
    createHoodieVariant('Old Gold', '#CFB53B'),
    createHoodieVariant('Orange', '#FFA500'),
    createHoodieVariant('Orchid', '#DA70D6'),
    createHoodieVariant('Purple', '#800080'),
    createHoodieVariant('Red', '#DC2626'),
    createHoodieVariant('Royal', '#4169E1'),
    createHoodieVariant('Safety Green', '#16A34A'),
    createHoodieVariant('Safety Orange', '#FF8C00'),
    createHoodieVariant('Safety Pink', '#FF69B4'),
    createHoodieVariant('Sand', '#F4A460'),
    createHoodieVariant('Sapphire', '#0F52BA'),
    createHoodieVariant('Sport Grey', '#6B7280'),
    createHoodieVariant('Violet', '#8A2BE2'),
    createHoodieVariant('white', '#FFFFFF'),
  ]);
  
  return [
    {
      name: 'Premium Cotton Hoodie',
      description: 'Soft, comfortable 100% cotton hoodie with fleece lining. Perfect for casual wear and colder weather. Features adjustable drawstring hood and kangaroo pocket.',
      price: 3999, // $39.99
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      stock: 100,
      customizable: true,
      customizationType: 'both',
      variants: hoodieVariants,
      designTemplate: {
        type: 'predefined',
        layers: [
          createTextLayer('CUSTOM HOODIE', 250, 200, { 
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
};

try {
  // Clear existing data
  await Promise.all([
    Product.deleteMany({}), 
    User.deleteMany({ role: 'admin' })
  ]);
  
  console.log('🗑️  Cleared existing data...');
  
  // Create sample products with uploaded images
  const tshirtProducts = await createSampleProducts();
  const hoodieProducts = await createHoodieProducts();
  
  // Combine all products
  const allProducts = [...tshirtProducts, ...hoodieProducts];
  
  // Log expected image files for the first product (T-shirt)
  if (tshirtProducts.length > 0) {
    logExpectedImages(tshirtProducts[0].variants);
  }
  
  // Create products with slugs
  const products = [];
  for (const productData of allProducts) {
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
  console.log(`- T-shirts: ${tshirtProducts.length} (${tshirtProducts[0]?.variants.length || 0} color variants)`);
  console.log(`- Hoodies: ${hoodieProducts.length} (${hoodieProducts[0]?.variants.length || 0} color variants)`);
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
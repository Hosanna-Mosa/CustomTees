import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Product from '../src/models/Product.js';
import { configureCloudinary, uploadImage } from '../src/services/cloudinary.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tshirtFolderCandidates = [
  path.join(__dirname, '..', 'Uploads', 't-shirts'),
  path.join(__dirname, '..', 'uploads', 't-shirts'),
  path.join(__dirname, '..', 'Uploads', 'tshirts'),
  path.join(__dirname, '..', 'uploads', 'tshirts')
];

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

const findTshirtFolder = () => {
  for (const folder of tshirtFolderCandidates) {
    if (fs.existsSync(folder)) return folder;
  }
  return null;
};

const stripPrefixes = (value, prefixes) => {
  let result = value;
  for (const prefix of prefixes) {
    const regex = new RegExp(`^${prefix}[-_]?`, 'i');
    if (regex.test(result)) {
      result = result.replace(regex, '');
      break;
    }
  }
  return result;
};

const parseSideAndColor = (fileName) => {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let colorPart = base;
  let side = null;

  const sideMatch = colorPart.match(/(?:[-_]?)(front|back)$/i);
  if (sideMatch) {
    side = sideMatch[1].toLowerCase();
    colorPart = colorPart.slice(0, sideMatch.index);
  }

  colorPart = stripPrefixes(colorPart.replace(/[-_]+$/g, ''), ['t-shirt', 'tshirt', 'tee', 'shirt']);
  const colorKey = colorPart.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const displayName = prettifyColorName(colorPart);

  return { colorKey, displayName, side };
};

const buildVariantsFromFolder = async (folderPath) => {
  const files = fs.readdirSync(folderPath).filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));
  if (!files.length) {
    console.warn('⚠️  No image files found for t-shirt uploads.');
    return [];
  }

  const variantsMap = new Map();

  for (const fileName of files) {
    const { colorKey, displayName, side } = parseSideAndColor(fileName);
    if (!colorKey || !side) {
      console.warn(`⚠️  Skipping ${fileName} – unable to determine color/side.`);
      continue;
    }

    const filePath = path.join(folderPath, fileName);
    console.log(`☁️  Uploading t-shirt variant image: ${fileName}`);
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

const seedTshirtVariants = async () => {
  const folderPath = findTshirtFolder();
  if (!folderPath) {
    console.error('❌ uploads/t-shirts folder not found. Cannot seed t-shirt variants.');
    process.exit(1);
  }

  await connectDB();
  configureCloudinary();

  try {
    const variants = await buildVariantsFromFolder(folderPath);
    if (!variants.length) {
      console.warn('⚠️  No variants generated from t-shirt uploads. Exiting.');
      process.exit(0);
    }

    const productName = 'Classic Cotton T-Shirt';
    const slug = slugify(productName, { lower: true });

    let product = await Product.findOne({ slug });
    if (!product) {
      console.log('ℹ️  T-shirt product not found. Creating a new entry.');
      product = await Product.create({
        name: productName,
        slug,
        description: 'Soft, comfortable 100% cotton t-shirt perfect for everyday wear. Pre-shrunk and machine washable.',
        price: 2499,
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        stock: 120,
        customizable: true,
        customizationType: 'both',
        variants
      });
    } else {
      product.variants = variants;
      await product.save();
    }

    console.log(`✅ Seeded ${variants.length} t-shirt variants for product "${product.name}"`);
  } catch (error) {
    console.error('❌ Failed to seed t-shirt variants:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedTshirtVariants().then(() => {
  console.log('🎉 T-shirt variant seeding complete.');
  process.exit(0);
});


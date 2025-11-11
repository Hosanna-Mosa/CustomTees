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

const kidsFolderCandidates = [
  path.join(__dirname, '..', 'Uploads', 'kids'),
  path.join(__dirname, '..', 'uploads', 'kids')
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

const findKidsFolder = () => {
  for (const folder of kidsFolderCandidates) {
    if (fs.existsSync(folder)) {
      return folder;
    }
  }
  return null;
};

const parseSideAndColor = (fileName) => {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let colorPart = base.replace(/^kids[-_]?/i, '');
  let side = null;

  if (/front$/i.test(colorPart)) {
    side = 'front';
    colorPart = colorPart.replace(/front$/i, '');
  } else if (/back$/i.test(colorPart)) {
    side = 'back';
    colorPart = colorPart.replace(/back$/i, '');
  } else if (/[-_]front$/i.test(colorPart)) {
    side = 'front';
    colorPart = colorPart.replace(/[-_]front$/i, '');
  } else if (/[-_]back$/i.test(colorPart)) {
    side = 'back';
    colorPart = colorPart.replace(/[-_]back$/i, '');
  }

  colorPart = colorPart.replace(/[-_]+$/g, '');
  const colorKey = colorPart.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return { colorKey, displayName: prettifyColorName(colorPart), side };
};

const buildVariantsFromFolder = async (folderPath) => {
  const files = fs.readdirSync(folderPath).filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));
  if (!files.length) {
    console.warn('⚠️  No image files found in kids uploads folder.');
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
    console.log(`☁️  Uploading ${fileName} to Cloudinary...`);
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

const seedKidsVariants = async () => {
  const kidsFolder = findKidsFolder();
  if (!kidsFolder) {
    console.error('❌ uploads/kids folder not found. Cannot seed kids variants.');
    process.exit(1);
  }

  await connectDB();
  configureCloudinary();

  try {
    const variants = await buildVariantsFromFolder(kidsFolder);
    if (!variants.length) {
      console.warn('⚠️  No variants generated from kids uploads. Exiting.');
      process.exit(0);
    }

    const productName = 'Kids T-Shirts';
    const slug = slugify(productName, { lower: true });

    let product = await Product.findOne({ slug });
    if (!product) {
      console.log('ℹ️  Kids product not found. Creating a new product entry.');
      product = await Product.create({
        name: productName,
        slug,
        description: 'Bright, durable tees sized perfectly for kids, seeded from local uploads.',
        price: 1499,
        sizes: ['XS', 'S', 'M', 'L'],
        stock: 80,
        customizable: true,
        customizationType: 'both',
        variants
      });
    } else {
      product.variants = variants;
      await product.save();
    }

    console.log(`✅ Seeded ${variants.length} kids variants for product "${product.name}"`);
  } catch (error) {
    console.error('❌ Failed to seed kids variants:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedKidsVariants().then(() => {
  console.log('🎉 Kids variant seeding complete.');
  process.exit(0);
});


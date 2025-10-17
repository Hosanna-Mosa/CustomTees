import { v2 as cloudinary } from 'cloudinary';

export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
};

export const uploadImage = async (filePath) => {
  const res = await cloudinary.uploader.upload(filePath, { folder: 'customtees/products' });
  return { url: res.secure_url, public_id: res.public_id };
};

export const destroyImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    // ignore not found
  }
};



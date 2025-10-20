import mongoose from 'mongoose';

const designSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    productSlug: String,
    selectedColor: String,
    selectedSize: String,
    frontDesign: {
      designData: Object,
      designLayers: [Object],
      previewImage: String,
    },
    backDesign: {
      designData: Object,
      designLayers: [Object],
      previewImage: String,
    },
    totalPrice: Number,
  },
  { timestamps: true }
);

export default mongoose.model('Design', designSchema);



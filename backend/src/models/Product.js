import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false }
);

// Layer schema for predefined design elements
const layerSchema = new mongoose.Schema(
  {
    layerType: { type: String, enum: ['text', 'image'], required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    rotation: { type: Number, default: 0 },
    scale: { type: Number, default: 1 },
    zIndex: { type: Number, default: 0 },
    properties: {
      // For text layers
      content: String,
      fontFamily: String,
      fontSize: Number,
      fontWeight: String,
      color: String,
      textAlign: String,

      // For image layers
      imageUrl: String,
      opacity: Number,
      cost: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

// Design schema for product templates or default layouts
const designSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['predefined', 'user'], default: 'predefined' },
    layers: [layerSchema],
    canvasSize: {
      width: { type: Number, default: 500 },
      height: { type: Number, default: 500 },
    },
    designJSON: Object, // optional Fabric.js/Konva JSON export
    previewUrl: String, // snapshot of full design
    totalCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    price: { type: Number, required: true },
    sizes: [{ type: String }],
    colors: [{ type: String }],
    images: {
      type: [imageSchema],
      validate: (v) => v.length > 0,
    },
    stock: { type: Number, default: 0 },

    // 👇 Customization fields
    customizable: { type: Boolean, default: false }, // enable/disable customization
    customizationType: {
      type: String,
      enum: ['predefined', 'own', 'both'],
      default: 'both',
    },
    designTemplate: designSchema, // base design or template (for predefined customization)

  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true }, // snapshot in cents
    customDesign: {
      frontDesign: {
        designData: { type: Object },
        designLayers: [{ type: Object }],
        previewImage: { type: String },
      },
      backDesign: {
        designData: { type: Object },
        designLayers: [{ type: Object }],
        previewImage: { type: String },
      },
      selectedColor: { type: String },
      selectedSize: { type: String },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], validate: v => v.length > 0 },
    total: { type: Number, required: true }, // in cents
    paymentMethod: { type: String, enum: ['cod', 'razorpay'], required: true },
    payment: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    },
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    status: {
      type: String,
      enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);



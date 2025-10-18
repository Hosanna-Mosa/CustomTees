import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://sunandvemavarapu_db_user:f0bvswyEV5YiTbup@custom-tees.2oo4bft.mongodb.net/';
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error', err.message);
    process.exit(1);
  }
};

export default connectDB;



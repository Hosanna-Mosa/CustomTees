import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import productRoutes from './src/routes/product.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import { notFound, errorHandler } from './src/middlewares/error.middleware.js';

dotenv.config();
const app = express();

// DB
connectDB();

// Middlewares
app.use(cors({
    origin: [
        "http://localhost:8080",
        "http://localhost:8081",
    ],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);

// Health
app.get('/api/health', (req, res) => res.json({ success: true, message: 'OK' }));

// Errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));



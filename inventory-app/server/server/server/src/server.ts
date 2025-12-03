import express, { Express } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Allow requests from React client
app.use(express.json()); // Body parser for JSON requests

// Connect to MongoDB
if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined in the environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully.');
    // Start server only after successful DB connection
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('API Endpoints are ready: /api/products, /api/orders');
    });
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    // Exit process with failure code
    process.exit(1);
  });

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Simple root route
app.get('/', (req, res) => {
    res.send('Inventory Management API is running.');
});
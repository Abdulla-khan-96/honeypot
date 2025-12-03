import express, { Request, Response } from 'express';
import Product, { IProduct } from '../models/Product';

const router = express.Router();

// GET /api/products - Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const products: IProduct[] = await Product.find().sort({ name: 1 });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// POST /api/products - Create a new product
router.post('/', async (req: Request, res: Response) => {
  const { name, price, stock, category } = req.body;
  
  if (!name || price === undefined || stock === undefined || !category) {
    return res.status(400).json({ message: 'Missing required product fields' });
  }

  try {
    const newProduct = new Product({ name, price, stock, category });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    if (error.code === 11000) { // MongoDB duplicate key error
        return res.status(409).json({ message: 'Product name already exists.' });
    }
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

export default router;
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order, { IOrder } from '../models/Order';
import Product, { IProduct } from '../models/Product';

const router = express.Router();

// GET /api/orders - Get all orders
router.get('/', async (req: Request, res: Response) => {
  try {
    // Populate product details for display in the client
    const orders = await Order.find()
      .populate('items.productId', 'name price') // Only populate name and price
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get a single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'name price');
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// POST /api/orders - Place a new order and reduce stock quantity (Transactional Update)
router.post('/', async (req: Request, res: Response) => {
  const { items, totalAmount } = req.body;

  if (!items || items.length === 0 || totalAmount === undefined) {
    return res.status(400).json({ message: 'Order must contain items and total amount.' });
  }

  // --- START TRANSACTION ---
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate stock and calculate actual total
    let calculatedTotal = 0;
    const updates = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }

      if (product.stock < item.qty) {
        // Validation: Stock is insufficient
        throw new Error(`Insufficient stock for ${product.name}. Requested: ${item.qty}, Available: ${product.stock}.`);
      }

      // Calculate the total based on current price (ensures data integrity)
      calculatedTotal += product.price * item.qty;

      // Prepare stock update
      updates.push({
        updateOne: {
          filter: { _id: item.productId },
          update: { $inc: { stock: -item.qty } }, // Reduce stock
        }
      });
    }

    // Basic price validation (optional, checks if client-side total is reasonable)
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        // You might log this as a potential fraud attempt or a client-side bug
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Total amount mismatch. Calculated: ${calculatedTotal.toFixed(2)}, Received: ${totalAmount.toFixed(2)}` });
    }

    // 2. Perform all stock updates in bulk
    if (updates.length > 0) {
      await Product.bulkWrite(updates, { session });
    }

    // 3. Create the order
    const newOrder = new Order({
      items,
      totalAmount: calculatedTotal,
      status: 'Pending',
    });
    const savedOrder = await newOrder.save({ session });

    // 4. Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Respond with the newly created order
    res.status(201).json(savedOrder);
  } catch (error: any) {
    // 5. If any error occurs, abort the transaction to rollback all changes
    await session.abortTransaction();
    session.endSession();
    console.error('Order creation failed (Transaction rolled back):', error.message);
    res.status(500).json({ message: error.message || 'Failed to place order due to a stock issue or internal error. Transaction rolled back.' });
  }
});

export default router;
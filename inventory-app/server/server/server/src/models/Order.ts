import mongoose, { Document, Schema } from 'mongoose';

// Interface for items within the order
interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  qty: number;
  // We don't store the product name/price here to keep the schema clean, 
  // but it's common to store these for historical integrity.
}

// Interface for the Order document
export interface IOrder extends Document {
  items: IOrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: Date;
}

const OrderSchema: Schema = new Schema({
  items: [
    {
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      qty: { type: Number, required: true, min: 1 },
    },
  ],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IOrder>('Order', OrderSchema);
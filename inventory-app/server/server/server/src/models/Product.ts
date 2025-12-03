import mongoose, { Document, Schema } from 'mongoose';

// Interface for the Product document
export interface IProduct extends Document {
  name: string;
  price: number;
  stock: number;
  category: string;
  createdAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0.01 },
  stock: { type: Number, required: true, min: 0 }, // Stock level
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IProduct>('Product', ProductSchema);
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from './store';

// --- Type Definitions ---
export interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  createdAt: string;
}

interface OrderItem {
  productId: string | { _id: string; name: string; price: number }; // Can be ID or populated object
  qty: number;
}

export interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

interface InventoryState {
  products: Product[];
  orders: Order[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state for the slice
const initialState: InventoryState = {
  products: [],
  orders: [],
  status: 'idle',
  error: null,
};

const API_BASE_URL = 'http://localhost:5000/api';

// --- Async Thunks (API Calls) ---

// Thunk to fetch all products
export const fetchProducts = createAsyncThunk('inventory/fetchProducts', async () => {
  const response = await axios.get<Product[]>(`${API_BASE_URL}/products`);
  return response.data;
});

// Thunk to fetch all orders
export const fetchOrders = createAsyncThunk('inventory/fetchOrders', async () => {
  const response = await axios.get<Order[]>(`${API_BASE_URL}/orders`);
  return response.data;
});

// Thunk to place a new order (includes transactional update logic on the backend)
export const placeOrder = createAsyncThunk<
  Order, // Return type on success
  { items: { productId: string; qty: number }[]; totalAmount: number }, // Argument type
  { state: RootState; rejectWithValue: string } // Thunk options
>('inventory/placeOrder', async (orderData, { getState, rejectWithValue }) => {
  try {
    const response = await axios.post<Order>(`${API_BASE_URL}/orders`, orderData);
    
    // Optimistic UI Update failure fallback (done in the reducer)
    // Here we return the new order data
    return response.data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response) {
      // Use the error message from the backend for validation/stock failure
      return rejectWithValue(err.response.data.message || 'Failed to place order.');
    }
    return rejectWithValue('An unknown error occurred.');
  }
});


// --- Redux Slice ---

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    // Other synchronous reducers can go here if needed
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Products ---
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Could not fetch products.';
      })

      // --- Fetch Orders ---
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.status = 'succeeded';
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Could not fetch orders.';
      })
      
      // --- Place Order ---
      .addCase(placeOrder.pending, (state) => {
        state.status = 'loading';
      })
      // Success: Add order, and crucially, update local product stock (Optimistic UI fallback/Confirmation)
      .addCase(placeOrder.fulfilled, (state, action: PayloadAction<Order>) => {
        state.status = 'succeeded';
        state.orders.unshift(action.payload); // Add new order to the top

        // Update product stocks locally for immediate UI feedback
        action.payload.items.forEach(orderItem => {
            const productId = typeof orderItem.productId === 'string' 
                            ? orderItem.productId 
                            : orderItem.productId._id;
            
            const product = state.products.find(p => p._id === productId);
            if (product) {
                product.stock -= orderItem.qty; // Decrease stock
            }
        });
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || action.error.message || 'Order failed.';
        // If the transaction failed on the backend (e.g., stock check),
        // we don't need a rollback here as no change was made.
      });
  },
});

export default inventorySlice.reducer;
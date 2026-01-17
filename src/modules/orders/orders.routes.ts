import { Router } from 'express';
import { createOrder, updateOrderStatus, cancelOrder, getOrderHistory} from './orders.controller';


const router = Router();

// Create order
router.post('/', createOrder);

// Update order status
router.patch('/:id/status', updateOrderStatus);

//Cancel order and Restore stock
router.patch('/:id/cancel', cancelOrder);

//GET ORDER HISTORY
router.get('/history', getOrderHistory);

export default router;

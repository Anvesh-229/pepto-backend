import { Router } from 'express';
import { createOrder } from './orders.controller';
import { updateOrderStatus } from './orders.controller';

const router = Router();

// Create order
router.post('/', createOrder);

// Update order status
router.patch('/:id/status', updateOrderStatus);

export default router;

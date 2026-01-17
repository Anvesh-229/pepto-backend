import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { OrderStatus } from './order-status.enum';

// =========================
// CREATE ORDER
// =========================
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { userId, storeId, items } = req.body;

    if (!userId || !storeId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Invalid order data',
      });
    }

    const order = await OrdersService.createOrder(
      userId,
      storeId,
      items
    );

    return res.status(201).json(order);
  } catch (err: any) {
    console.error('Create order error:', err.message);
    return res.status(400).json({
      message: err.message || 'Order creation failed',
    });
  }
};

// =========================
// UPDATE ORDER STATUS
// =========================
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        message: 'Order ID and status are required',
      });
    }

    // Validate status enum
    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({
        message: 'Invalid order status',
      });
    }

    const result = await OrdersService.updateOrderStatus(
      orderId,
      status as OrderStatus
    );

    return res.json(result);
  } catch (err: any) {
    console.error('Update status error:', err.message);
    return res.status(400).json({
      message: err.message,
    });
  }
};

// =========================
// CANCEL ORDER STATUS
// =========================
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.id);

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID required' });
    }

    const result = await OrdersService.cancelOrder(orderId);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({
      message: err.message,
    });
  }
};

// =========================
// GET ORDER HISTORY
// =========================

export const getOrderHistory = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.query.userId);
    const type =
      req.query.type === 'active' ? 'active' : 'past';

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
      });
    }

    const result = await OrdersService.getOrderHistory(
      userId,
      type,
      page,
      limit
    );

    return res.json(result);

  } catch (err: any) {
    console.error('Order history error:', err.message);
    return res.status(500).json({
      message: 'Failed to fetch order history',
    });
  }
};



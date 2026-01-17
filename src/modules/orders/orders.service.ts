import { db } from '../../db';
import { OrderStatus } from './order-status.enum';
import { validateStatusTransition } from './order.validator';

type OrderItem = {
  productId: number;
  quantity: number;
};

export class OrdersService {

  // =========================
  // CREATE ORDER (UNCHANGED)
  // =========================
  static async createOrder(
    userId: number,
    storeId: number,
    items: OrderItem[]
  ) {
    // 1️⃣ Fetch product prices
    const productIds = items.map(i => i.productId);

    const productsRes = await db.query(
      `SELECT id, price FROM products WHERE id = ANY($1)`,
      [productIds]
    );

    if (productsRes.rowCount !== items.length) {
      throw new Error('Invalid product in cart');
    }

    // 2️⃣ Calculate total
    let orderTotal = 0;
    const priceMap: Record<number, number> = {};

    productsRes.rows.forEach(p => {
      priceMap[p.id] = Number(p.price);
    });

    items.forEach(i => {
      orderTotal += priceMap[i.productId] * i.quantity;
    });

    // 3️⃣ Create order
    const orderRes = await db.query(
      `INSERT INTO orders (user_id, store_id, status, order_total)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, storeId, OrderStatus.PLACED, orderTotal]
    );

    const orderId = orderRes.rows[0].id;

    // 4️⃣ Insert order items
    for (const item of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [
          orderId,
          item.productId,
          item.quantity,
          priceMap[item.productId],
        ]
      );
    }

    return {
      orderId,
      status: OrderStatus.PLACED,
      orderTotal,
    };
  }

  // =========================
  // UPDATE ORDER STATUS (NEW)
  // =========================
  static async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus
  ) {
    // 1️⃣ Get current status
    const result = await db.query(
      `SELECT status FROM orders WHERE id = $1`,
      [orderId]
    );

    if (result.rowCount === 0) {
      throw new Error('Order not found');
    }

    const currentStatus = result.rows[0].status as OrderStatus;

    // 2️⃣ Validate transition
    validateStatusTransition(currentStatus, newStatus);

    // 3️⃣ Update status
    await db.query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [newStatus, orderId]
    );

    return {
      orderId,
      previousStatus: currentStatus,
      currentStatus: newStatus,
    };
  }
}

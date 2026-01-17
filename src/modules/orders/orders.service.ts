import { db } from '../../db';
import { OrderStatus } from './order-status.enum';
import { validateStatusTransition } from './order.validator';
import { WalletService } from '../wallet/wallet.service';

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
    const productIds = items.map(i => i.productId);

    const productsRes = await db.query(
      `SELECT id, price FROM products WHERE id = ANY($1)`,
      [productIds]
    );

    if (productsRes.rowCount !== items.length) {
      throw new Error('Invalid product in cart');
    }

    let orderTotal = 0;
    const priceMap: Record<number, number> = {};

    productsRes.rows.forEach(p => {
      priceMap[p.id] = Number(p.price);
    });

    items.forEach(i => {
      orderTotal += priceMap[i.productId] * i.quantity;
    });

    const orderRes = await db.query(
      `INSERT INTO orders (user_id, store_id, status, order_total)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, storeId, OrderStatus.PLACED, orderTotal]
    );

    const orderId = orderRes.rows[0].id;

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
  // UPDATE ORDER STATUS + INVENTORY
  // =========================
  static async updateOrderStatus(
    orderId: number,
    newStatus: OrderStatus
  ) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        `SELECT status, user_id, store_id, order_total
        FROM orders WHERE id = $1`,
        [orderId]
      );

      if (orderRes.rowCount === 0) {
        throw new Error('Order not found');
      }

      const order = orderRes.rows[0];
      const currentStatus = order.status as OrderStatus;

      validateStatusTransition(currentStatus, newStatus);

      // 🔥 ACCEPTED = INVENTORY + WALLET DEBIT
      if (newStatus === OrderStatus.ACCEPTED) {

        const items = await client.query(
          `SELECT product_id, quantity
          FROM order_items WHERE order_id = $1`,
          [orderId]
        );

        // Inventory check
        for (const item of items.rows) {
          const inv = await client.query(
            `SELECT quantity FROM inventory
            WHERE store_id = $1 AND product_id = $2 FOR UPDATE`,
            [order.store_id, item.product_id]
          );

          if (inv.rowCount === 0 || inv.rows[0].quantity < item.quantity) {
            throw new Error('Insufficient inventory');
          }
        }

        // Deduct inventory
        for (const item of items.rows) {
          await client.query(
            `UPDATE inventory
            SET quantity = quantity - $1
            WHERE store_id = $2 AND product_id = $3`,
            [item.quantity, order.store_id, item.product_id]
          );
        }

        // 💳 WALLET DEBIT
        await WalletService.debit(
          order.user_id,
          orderId,
          Number(order.order_total),
          client
        );
      }

      await client.query(
        `UPDATE orders SET status = $1 WHERE id = $2`,
        [newStatus, orderId]
      );

      await client.query('COMMIT');

      return {
        orderId,
        previousStatus: currentStatus,
        currentStatus: newStatus,
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================
  // Cancel ORDER STATUS + RESTOCK
  // =========================
  static async cancelOrder(orderId: number) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // 1️⃣ Fetch order (FULL DATA)
      const orderRes = await client.query(
        `SELECT status, store_id, user_id, order_total
        FROM orders
        WHERE id = $1`,
        [orderId]
      );

      if (orderRes.rowCount === 0) {
        throw new Error('Order not found');
      }

      const { status, store_id, user_id, order_total } = orderRes.rows[0];

      // 2️⃣ Validate cancellable
      if (
        ![
          OrderStatus.PLACED,
          OrderStatus.ACCEPTED,
          OrderStatus.PACKING,
        ].includes(status)
      ) {
        throw new Error('Order cannot be cancelled at this stage');
      }

      // 3️⃣ Restore inventory (ONLY if already deducted)
      if (
        [OrderStatus.ACCEPTED, OrderStatus.PACKING].includes(status)
      ) {
        const itemsRes = await client.query(
          `SELECT product_id, quantity
          FROM order_items
          WHERE order_id = $1`,
          [orderId]
        );

        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE inventory
            SET quantity = quantity + $1
            WHERE store_id = $2 AND product_id = $3`,
            [item.quantity, store_id, item.product_id]
          );
        }

        // 💳 REFUND WALLET (ONLY IF DEBITED)
        await WalletService.credit(
          user_id,
          orderId,
          Number(order_total),
          client
        );
      }

      // 4️⃣ Update order status
      await client.query(
        `UPDATE orders SET status = $1 WHERE id = $2`,
        [OrderStatus.CANCELLED, orderId]
      );

      await client.query('COMMIT');

      return {
        orderId,
        status: OrderStatus.CANCELLED,
      };

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // =========================
  // ORDER HISTORY
  // =========================

  static async getOrderHistory(
    userId: number,
    type: 'active' | 'past',
    page: number,
    limit: number
  ) {
    const offset = (page - 1) * limit;

    const activeStatuses = [
      'PLACED',
      'ACCEPTED',
      'PACKING',
      'PACKED',
      'OUT_FOR_DELIVERY',
    ];

    const pastStatuses = ['DELIVERED', 'CANCELLED'];

    const statuses =
      type === 'active' ? activeStatuses : pastStatuses;

    const ordersRes = await db.query(
      `SELECT
          o.id AS order_id,
          o.status,
          o.order_total,
          o.created_at,
          s.id AS store_id,
          s.name AS store_name
      FROM orders o
      JOIN stores s ON s.id = o.store_id
      WHERE o.user_id = $1
        AND o.status = ANY($2)
      ORDER BY o.created_at DESC
      LIMIT $3 OFFSET $4`,
      [userId, statuses, limit, offset]
    );

    if (ordersRes.rowCount === 0) {
      return {
        page,
        limit,
        orders: [],
      };
    }

    const orderIds = ordersRes.rows.map(o => o.order_id);

    const itemsRes = await db.query(
      `SELECT
          oi.order_id,
          oi.product_id,
          p.name,
          oi.quantity,
          oi.price
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ANY($1)`,
      [orderIds]
    );

    const itemsByOrder: Record<number, any[]> = {};

    itemsRes.rows.forEach(item => {
      if (!itemsByOrder[item.order_id]) {
        itemsByOrder[item.order_id] = [];
      }

      itemsByOrder[item.order_id].push({
        productId: item.product_id,
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
      });
    });

    const orders = ordersRes.rows.map(o => ({
      orderId: o.order_id,
      status: o.status,
      orderTotal: Number(o.order_total),
      createdAt: o.created_at,
      store: {
        id: o.store_id,
        name: o.store_name,
      },
      items: itemsByOrder[o.order_id] || [],
    }));

    return {
      page,
      limit,
      orders,
    };
  }

}

import { OrderStatus } from './order-status.enum';
import { validateStatusTransition } from './order.validator';

export class OrderService {

  static createOrder(userId: number, storeId: number) {
    return {
      status: OrderStatus.PLACED,
      userId,
      storeId,
      placed_at: new Date(),
    };
  }

  static updateStatus(order, nextStatus: OrderStatus) {

    validateStatusTransition(order.status, nextStatus);

    order.status = nextStatus;

    // timestamps
    order[`${nextStatus.toLowerCase()}_at`] = new Date();

    // commission logic trigger
    if (nextStatus === OrderStatus.PACKED) {
      // calculate commission here later
    }

    return order;
  }
}

import { OrderService } from './order.service';
import { OrderStatus } from './order-status.enum';

export class OrderController {

  static create(req) {
    const { userId, storeId } = req.body;
    return OrderService.createOrder(userId, storeId);
  }

  static updateStatus(req) {
    const { order, status } = req.body;
    return OrderService.updateStatus(order, status as OrderStatus);
  }
}

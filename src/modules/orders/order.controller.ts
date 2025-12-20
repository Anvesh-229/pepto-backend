import { OrderService } from './order.service';
import { OrderStatus } from './order-status.enum';
import { UserRole } from '../auth/roles.enum';

export class OrderController {

  static updateStatus(req, res) {

    const user = req.user;                 // from authGuard
    const order = req.order;               // fetched earlier
    const nextStatus = req.body.status as OrderStatus;

    // 🔐 SIMPLE ROLE CHECK (INLINE, MVP STYLE)
    if (user.role === UserRole.STORE) {
      if (![OrderStatus.ACCEPTED, OrderStatus.PACKING, OrderStatus.PACKED]
        .includes(nextStatus)) {
        return res.status(403).json({
          message: 'Store not allowed to set this status'
        });
      }
    }

    if (user.role === UserRole.ADMIN) {
      if (nextStatus !== OrderStatus.OUT_FOR_DELIVERY) {
        return res.status(403).json({
          message: 'Admin not allowed to set this status'
        });
      }
    }

    if (user.role === UserRole.DELIVERY) {
      if (nextStatus !== OrderStatus.DELIVERED) {
        return res.status(403).json({
          message: 'Delivery not allowed to set this status'
        });
      }
    }

    // ✅ SEQUENCE VALIDATION + UPDATE
    const updatedOrder =
      OrderService.updateStatus(order, nextStatus);

    return res.json(updatedOrder);
  }
}

import { OrderStatus } from './order-status.enum';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PLACED: [OrderStatus.ACCEPTED],
  ACCEPTED: [OrderStatus.PACKING],
  PACKING: [OrderStatus.PACKED],
  PACKED: [OrderStatus.OUT_FOR_DELIVERY],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [],
};

export function validateStatusTransition(
  current: OrderStatus,
  next: OrderStatus
) {
  if (!transitions[current].includes(next)) {
    throw new Error(
      `Invalid transition from ${current} to ${next}`
    );
  }
}

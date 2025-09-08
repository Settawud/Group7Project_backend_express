export default class Order {
  constructor({ id, userId, items, total, createdAt = new Date().toISOString() }) {
    this.id = id;
    this.userId = userId;
    this.items = items; // [{ skuId, name, price, quantity }]
    this.total = Number(total) || 0;
    this.createdAt = createdAt;
  }
}


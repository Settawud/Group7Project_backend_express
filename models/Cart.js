export default class Cart {
  constructor({ userId, items = [] }) {
    this.userId = userId;
    this.items = items; // [{ skuId, quantity }]
  }
}


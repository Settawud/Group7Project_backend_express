export default class Product {
  constructor({ skuId, name, description = "", price = 0, category = "", stock = 0, images = [] }) {
    this.skuId = skuId;
    this.name = name;
    this.description = description;
    this.price = Number(price) || 0;
    this.category = category;
    this.stock = Number(stock) || 0;
    this.images = images;
  }
}


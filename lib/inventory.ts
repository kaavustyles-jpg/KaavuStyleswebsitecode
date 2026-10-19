import type { Product, OrderItem } from "./mockData";

export function resolveProductColor(product: Product, selected: unknown): string {
  const colors = product.colors || [];
  if (!colors.length) return "Standard";
  const requested = typeof selected === "string" ? selected.trim() : "";
  const match = colors.find(color => color.trim().toLowerCase() === requested.toLowerCase());
  if (match) return match;
  if ((!requested || requested === "Standard") && colors.length === 1) return colors[0];
  throw new Error(`${product.name}: the saved color is no longer available. Remove this item from your cart and add it again with your preferred color.`);
}

export function stockForSize(product: Product, size: string): number {
  if (product.variantStock) return Math.max(0, Math.min(product.stock, Object.values(product.variantStock[size] || {}).reduce((sum, qty) => sum + qty, 0)));
  return Math.max(0, Math.min(product.stock, product.sizeStock ? product.sizeStock[size] ?? 0 : product.stock));
}

export function stockForVariant(product: Product, size: string, color: string): number {
  return product.variantStock ? Math.max(0, Math.min(product.stock, product.variantStock[size]?.[color] ?? 0)) : stockForSize(product, size);
}
export function availableVariant(product: Product) {
  for (const size of product.sizes.length ? product.sizes : ["Standard"]) {
    for (const color of product.colors.length ? product.colors : ["Standard"]) {
      if (stockForVariant(product, size, color) > 0) return { size, color };
    }
  }
  return undefined;
}
export function sameStockPool(product: Product, size: string, color: string, otherSize: string, otherColor: string) {
  return product.variantStock ? size === otherSize && color === otherColor : product.sizeStock ? size === otherSize : true;
}
export function variantInventory(sizes: string[], colors: string[], values: NonNullable<Product["variantStock"]>) {
  const variantStock: NonNullable<Product["variantStock"]> = {};
  const sizeStock: Record<string, number> = {};
  let stock = 0;
  for (const size of sizes.length ? sizes : ["Standard"]) {
    variantStock[size] = {}; sizeStock[size] = 0;
    for (const color of colors.length ? colors : ["Standard"]) {
      const qty = values[size]?.[color] ?? 0;
      if (!Number.isSafeInteger(qty) || qty < 0) throw new Error("Stock quantities must be whole numbers, zero or greater.");
      variantStock[size][color] = qty; sizeStock[size] += qty; stock += qty;
    }
  }
  return { variantStock, sizeStock, stock };
}

export function reduceInventory(products: Product[], items: OrderItem[]): Product[] {
  const next = products.map(product => ({ ...product, sizeStock: product.sizeStock ? { ...product.sizeStock } : undefined, variantStock: product.variantStock ? Object.fromEntries(Object.entries(product.variantStock).map(([size, quantities]) => [size, { ...quantities }])) : undefined }));
  for (const item of items) {
    const product = next.find(value => value.id === item.productId);
    if (!product || !Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error("Invalid order item.");
    if (!(product.sizes.length ? product.sizes : ["Standard"]).includes(item.size)) throw new Error("Please select an available size.");
    if (!(product.colors.length ? product.colors : ["Standard"]).includes(item.color)) throw new Error("Please select an available color.");
    if (stockForVariant(product, item.size, item.color) < item.quantity || product.stock < item.quantity) throw new Error(`${product.name}: size ${item.size}, color ${item.color} has insufficient stock.`);
    if (product.variantStock) product.variantStock[item.size][item.color] -= item.quantity;
    if (product.sizeStock) product.sizeStock[item.size] -= item.quantity;
    product.stock -= item.quantity;
  }
  return next;
}

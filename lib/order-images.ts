import type { OrderItem } from "./mockData";

export function orderImageUrl(value: unknown): string {
  if (typeof value !== "string") return "/icon.jpeg";
  if (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)) return value;
  return "/icon.jpeg";
}
export function cleanOrderItems(items: OrderItem[]): OrderItem[] {
  return items.map(item => ({ ...item, image: orderImageUrl(item.image) }));
}
export function cleanOrderRow(row: any) {
  return { ...row, items: cleanOrderItems(Array.isArray(row.items) ? row.items : []) };
}

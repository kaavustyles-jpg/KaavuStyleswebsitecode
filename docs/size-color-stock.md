# Stock for each size and color

1. Apply `migrations/product-variant-stock.sql` in Supabase SQL Editor before using the updated product form.
2. Deploy/restart the app.
3. Open Admin → Products → Edit or Admin → Inventory.
4. Select the actual sizes and colors. Enter the quantity for every combination, then save.

For a single Free Size product, Wine Maroon 5, Blush Pink 3, and Mocha Brown 0 are separate quantities. The total is 8. A Wine Maroon purchase reduces only Wine Maroon. Mocha Brown is unavailable even while other colors have stock. Photos continue to switch by color.

The `variant_stock` JSON stores sizes as outer keys and colors as inner keys. Product stock and size totals are computed from those entries. Checkout uses row locks and deducts the exact size/color atomically. Cart limits and the quick-add button use the same availability checks.

Existing stock is not automatically split across colors. Until an admin allocates it, older products retain their shared stock behavior. Editing details alone preserves that existing quantity. Once a quantity field is changed, the saved allocation is authoritative and untouched cells are zero. No remote database migration or stock changes are performed automatically.

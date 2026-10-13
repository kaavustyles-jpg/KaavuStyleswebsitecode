# Shiprocket order integration

The API email and password are stored server-side in `.env.local`. Parcel measurements are entered for each order in Admin → Orders → Shipping; there are no fixed weight or dimensions in environment variables.

1. Apply `migrations/shiprocket-orders.sql` in the Supabase SQL editor.
2. Register the supplied pickup address in Shiprocket Settings → Pickup Addresses. The admin form retrieves the registered names and addresses; an address string is not a pickup-location name. Complete KYC and add wallet funds before booking courier services.
3. Restart the development server. Sign in again at `/admin/login` to obtain the server-verified admin cookie. Admin credentials are read from `ADMIN_LOGIN_EMAILS` and `ADMIN_LOGIN_PASSWORD`; `ADMIN_SESSION_SECRET` signs the cookie. The local values preserve the previous admin login credentials. Set a strong admin password before production use.
4. In Admin → Orders, click Shipping for a paid order. Confirm the delivery state, choose the pickup location, and enter packed weight in kg plus length/width/height in cm. Click Create Shiprocket order.
5. The integration saves the Shiprocket order ID, shipment ID, pickup name, delivery state and measurements. Open Shiprocket to assign a courier, generate the AWB/label, and schedule pickup. These courier-booking actions are performed in Shiprocket; the app does not automatically mark an order as shipped or sync tracking.

For deployment, add the server environment variables `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_LOGIN_EMAILS`, `ADMIN_LOGIN_PASSWORD`, and `ADMIN_SESSION_SECRET`. Never prefix them with `NEXT_PUBLIC_`.

Concurrent shipment requests are prevented by a database claim. If a gateway/network failure occurs after claiming, the record stays Creating: check Shiprocket for the seller order number before clearing or correcting the saved claim. This avoids blindly creating duplicate shipments. No real shipment is created as part of automated tests.

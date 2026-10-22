# Cancelled and mismatched Shiprocket records

Apply `migrations/shiprocket-replacements.sql`, deploy the updated code, and sign into Admin → Orders.

1. Open Shipping / Shipment for an affected website order.
2. Click Refresh Shiprocket status. This reads the linked remote order and verifies its reference, amount and customer email before updating the saved link and fulfillment status. A clearly older remote record is also rejected.
3. A cancelled shipment remains a paid website order in Processing. A mismatched older test record is labelled Mismatch; it is not treated as the customer's current shipment. Confirm parcel details and use Create replacement shipment if delivery is still required.
4. The website order number remains KAAVU00002. Shiprocket receives a unique reference containing that number, the website order UUID and a shipment-attempt suffix, for example `KAAVU00002-<uuid-without-dashes>-S2`. This avoids collisions with cancelled and old test orders. Prior saved shipment metadata is retained in history.
5. Creating the remote order does not book a courier or mark it Shipped. Choose courier, create label and schedule pickup in Shiprocket. Refresh the website shipment to read actual dispatch/delivery status.

No remote cancellation, refund, courier booking or automatic replacement is performed by this change. Existing database records are updated only when an authenticated admin refreshes or creates a shipment.

An ambiguous timeout or failed link-save retains Creating and its unique reference. Refresh searches for that exact reference and can repair the link after a successful remote creation. If no remote record is found, the app refuses blind retries; an administrator must verify the outcome before resetting an uncertain request. A replacement is permitted only after an identified cancelled/mismatched/failed state, with a row lock and expected-current-state check preventing two simultaneous attempts.

Production and local Shiprocket API credentials must be valid. The last local credential check was rejected, so live account status synchronization has not been verified from this workspace.

import "server-only";
let cachedToken: { value: string; expires: number } | undefined;
async function token() {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error("Shiprocket API credentials are not configured on the server.");
  const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(15000) });
  const result = await response.json();
  if (!response.ok || !result.token) throw new Error("Shiprocket login failed. Check the API user's email and password.");
  cachedToken = { value: result.token, expires: Date.now() + 24 * 3600000 };
  return result.token as string;
}
export async function shiprocket(path: string, body?: unknown, retry = true): Promise<any> {
  const response = await fetch(`https://apiv2.shiprocket.in/v1/external/${path}`, { method: body ? "POST" : "GET", cache: "no-store", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  if (response.status === 401 && retry) { cachedToken = undefined; return shiprocket(path, body, false); }
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Shiprocket rejected the request. Check the details in your Shiprocket account.");
  return result;
}
export async function pickupLocations() {
  const result = await shiprocket("settings/company/pickup");
  const addresses = result.data?.shipping_address || result.shipping_address || [];
  return addresses.map((address: any) => ({ name: address.pickup_location, address: [address.address, address.address_2, address.city, address.state, address.pin_code].filter(Boolean).join(", ") }));
}

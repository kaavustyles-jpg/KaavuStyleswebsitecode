// Dry run: node scripts/migrate-order-images.cjs
// Back up, upload and replace: node scripts/migrate-order-images.cjs --apply
require('@next/env').loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const apply = process.argv.includes('--apply');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Configure the server Supabase URL and service-role key first.');
  const db = createClient(url, key, { auth: { persistSession: false } });
  let orders = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from('orders').select('id,items').order('id').range(offset, offset + 499);
    if (error) throw error;
    orders.push(...data);
    if (data.length < 500) break;
  }
  const affected = orders.filter(order => (order.items || []).some(item => typeof item.image === 'string' && item.image.startsWith('data:image/')));
  const imageCount = affected.reduce((sum, order) => sum + order.items.filter(item => item.image?.startsWith('data:image/')).length, 0);
  console.log(`${affected.length} orders contain ${imageCount} embedded image(s).`);
  if (!apply) { console.log('Dry run only. No records or images changed. Use --apply to back up and migrate.'); return; }
  if (!affected.length) return;
  const folder = path.join(process.cwd(), '.local-backups');
  fs.mkdirSync(folder, { recursive: true });
  const backup = path.join(folder, `order-items-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backup, JSON.stringify(affected), { flag: 'wx' });
  console.log(`Original items backed up to ${backup}`);
  let changed = 0;
  for (const order of affected) {
    const items = [];
    for (const item of order.items) {
      if (!item.image?.startsWith('data:image/')) { items.push(item); continue; }
      const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/.exec(item.image);
      if (!match) throw new Error('Unsupported embedded image. Original order items were not changed.');
      const bytes = Buffer.from(match[2], 'base64');
      const extension = match[1].split('/')[1].replace('jpeg', 'jpg');
      const digest = createHash('sha256').update(bytes).digest('hex');
      const object = `order-snapshots/${digest}.${extension}`;
      const { error: uploadError } = await db.storage.from('images').upload(object, bytes, { contentType: match[1], cacheControl: '31536000', upsert: true });
      if (uploadError) throw uploadError;
      const { data } = db.storage.from('images').getPublicUrl(object);
      items.push({ ...item, image: data.publicUrl });
    }
    // Update only items. Payment, shipping, customer details and totals remain unchanged.
    const { error } = await db.from('orders').update({ items }).eq('id', order.id);
    if (error) throw error;
    changed++;
  }
  console.log(`Migrated ${changed} order(s). No orders were deleted.`);
}
main().catch(error => { console.error(error.message || 'Migration failed. Keep the backup and retry after resolving the error.'); process.exitCode = 1; });

const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of env.split('\n')) {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
}
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: prods, error: err2 } = await supabase.from('products').select('*').limit(2);
  if (err2) {
    console.error('Error fetching products:', err2);
  } else {
    console.log('Sample Product Full Row:', JSON.stringify(prods, null, 2));
  }
}

run();

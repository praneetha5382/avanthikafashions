import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Service Role Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Reading db.json...");
  const rawData = fs.readFileSync('./src/lib/db.json', 'utf8');
  const data = JSON.parse(rawData);

  console.log("Migrating Categories...");
  for (const cat of data.categories || []) {
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      subcategories: cat.subcategories,
      isVisible: cat.isVisible !== false
    });
    if (error) console.error("Error migrating category:", cat.name, error.message);
  }

  console.log("Migrating Customers...");
  for (const cust of data.customers || []) {
    const { error } = await supabase.from('customers').upsert({
      id: cust.id,
      name: cust.name,
      mobile: cust.mobile,
      email: cust.email || null,
      verified: cust.verified,
      joined: new Date(cust.joined).toISOString()
    });
    if (error) console.error("Error migrating customer:", cust.name, error.message);
  }

  console.log("Migrating Products...");
  for (const prod of data.products || []) {
    const { error } = await supabase.from('products').upsert({
      id: prod.id,
      sku: prod.sku,
      slug: prod.slug,
      name: prod.name,
      description: prod.description,
      originalPrice: prod.originalPrice,
      price: prod.price,
      discount: prod.discount,
      mainCategory: prod.mainCategory,
      subCategory: prod.subCategory,
      isTrending: prod.isTrending,
      isNewArrival: prod.isNewArrival,
      isFreeShipping: prod.isFreeShipping !== false,
      info: prod.info,
      variants: prod.variants || (prod.colors ? prod.colors.map(c => ({ color: c, images: prod.images })) : [])
    });
    if (error) console.error("Error migrating product:", prod.name, error.message);
  }

  console.log("Migration Complete!");
}

migrate();

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Fetch all products
  const { data: products, error } = await supabase.from('products').select('id, name');
  
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  const demoProductIds = products
    .filter(p => !p.id.startsWith('s') || p.id.length < 10)
    .map(p => p.id);

  console.log('Found demo products to delete:', demoProductIds);

  if (demoProductIds.length > 0) {
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .in('id', demoProductIds);

    if (deleteError) {
      console.error('Error deleting products:', deleteError);
    } else {
      console.log(`Successfully deleted ${demoProductIds.length} demo products.`);
    }
  } else {
    console.log('No demo products found.');
  }
}

run();

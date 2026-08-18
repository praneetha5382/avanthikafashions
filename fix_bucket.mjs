import { createClient } from '@supabase/supabase-js';

const url = 'https://plhgojtcioatpehazoqn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaGdvanRjaW9hdHBlaGF6b3FuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjkwMjc2MCwiZXhwIjoyMTAyNDc4NzYwfQ.A6AqJ95zmcIEZlmwld-c2X5v2XeVt5kXgDvfRCDOc70';
const supabase = createClient(url, key);

async function run() {
  console.log("Checking bucket...");
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error);
    return;
  }
  
  const bucketExists = buckets.some(b => b.name === 'product-images');
  if (!bucketExists) {
    console.log("Bucket not found. Creating 'product-images'...");
    const { data, error: createError } = await supabase.storage.createBucket('product-images', { public: true });
    if (createError) {
      console.error("Failed to create bucket:", createError);
    } else {
      console.log("Bucket created successfully!");
    }
  } else {
    console.log("Bucket 'product-images' already exists.");
  }
}

run();

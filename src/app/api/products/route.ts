import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    
    // Fetch all required data in parallel
    const [
      { data: categories },
      { data: products },
      { data: settings },
      { data: customers }
    ] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('*'),
      supabase.from('customers').select('*').order('joined', { ascending: false })
    ]);

    const siteSettings = settings?.find((s: any) => s.key === 'siteSettings')?.value || {
      showHero: true, showQuickLinks: true, showTrending: true, showTopPicks: true,
      promo1: true, promo2: true, promo3: true, promo4: true
    };
    
    const hiddenProducts = settings?.find((s: any) => s.key === 'hiddenProducts')?.value || [];
    const productsWithVisibility = (products || []).map((p: any) => ({
      ...p,
      isVisible: !hiddenProducts.includes(p.id)
    }));

    return NextResponse.json({
      categories: categories || [],
      products: productsWithVisibility,
      settings: settings || [],
      customers: customers || [],
      siteSettings
    });
  } catch (error) {
    console.error('Supabase GET error:', error);
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabase = getServiceSupabase();
    
    // Manage Settings
    if (payload.action === 'updateSettings') {
      const { error } = await supabase.from('settings').upsert({ key: 'siteSettings', value: payload.settings });
      if (error) throw error;
      return NextResponse.json({ success: true, settings: payload.settings });
    }

    // Manage Categories (Add new Main Category)
    if (payload.action === 'addCategory') {
      const newCategory = { id: 'cat_' + Date.now(), name: payload.name, subcategories: [] };
      const { error } = await supabase.from('categories').insert(newCategory);
      if (error) throw error;
      return NextResponse.json({ success: true, category: newCategory });
    }

    // Add SubCategory
    if (payload.action === 'addSubCategory') {
      const { data: catData } = await supabase.from('categories').select('*').eq('name', payload.mainCategory).single();
      if (catData) {
        const subcategories = catData.subcategories || [];
        if (!subcategories.includes(payload.subCategory)) {
          const { error } = await supabase.from('categories').update({ subcategories: [...subcategories, payload.subCategory] }).eq('id', catData.id);
          if (error) throw error;
        }
      }
      return NextResponse.json({ success: true });
    }

    // Toggle Category Visibility
    if (payload.action === 'toggleCategory') {
      const { error } = await supabase.from('categories').update({ isVisible: payload.isVisible }).eq('id', payload.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Update existing product
    if (payload.action === 'updateProduct') {
      const { id, action, ...updateData } = payload;
      
      // Clean up transient data
      delete updateData.colors;
      delete updateData.images;
      delete updateData.fabric;
      delete updateData.weave;
      delete updateData.categoryId;
      
      const { error } = await supabase.from('products').update(updateData).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true, product: { id, ...updateData } });
    }

    // Toggle Product Visibility
    if (payload.action === 'toggleProductVisibility') {
      const { data: settings } = await supabase.from('settings').select('*').eq('key', 'hiddenProducts').single();
      let hidden = settings?.value || [];
      if (payload.isVisible === false) {
        if (!hidden.includes(payload.id)) hidden.push(payload.id);
      } else {
        hidden = hidden.filter((id: string) => id !== payload.id);
      }
      const { error } = await supabase.from('settings').upsert({ key: 'hiddenProducts', value: hidden });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Default: Add Product
    const newProduct = { ...payload };
    newProduct.id = 's' + Date.now();
    newProduct.slug = newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Clean up transient frontend data before sending to PG
    delete newProduct.colors;
    delete newProduct.images;
    delete newProduct.fabric;
    delete newProduct.weave;
    delete newProduct.categoryId;

    const { error } = await supabase.from('products').insert(newProduct);
    if (error) {
       console.error('Supabase DB Insert Error:', error);
       throw error;
    }

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Supabase POST error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

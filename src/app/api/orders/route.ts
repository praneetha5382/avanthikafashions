import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabaseClient';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '@/lib/email';

// GET all orders for Admin Panel
export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    console.error('Supabase GET Orders Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST a new order from Checkout
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabase = getServiceSupabase();
    
    // Generate an Order ID
    const orderId = 'ORD-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const newOrder = {
      id: orderId,
      customer_phone: payload.customer_phone,
      customer_email: payload.customer_email || null,
      customer_name: payload.customer_name,
      shipping_address: payload.shipping_address,
      items: payload.items,
      subtotal: payload.subtotal,
      shipping_cost: payload.shipping_cost,
      discount: payload.discount || 0,
      tax: payload.tax || 0,
      total: payload.total,
      payment_method: payload.payment_method,
      status: payload.payment_method === 'razorpay' ? 'Pending Payment' : 'Pending'
    };

    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) throw error;

    // Send email confirmation asynchronously
    sendOrderConfirmationEmail(newOrder).catch(console.error);

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error('Supabase POST Order Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to place order' }, { status: 500 });
  }
}

// PATCH to update order status
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    const supabase = getServiceSupabase();
    
    // Fetch the updated order to get the customer details for the email
    const { data: updatedOrder, error } = await supabase.from('orders').update({ status }).eq('id', id).select('*').single();
    if (error) throw error;

    // Send status update email if Shipped or Delivered
    if (status === 'Shipped' || status === 'Delivered') {
      sendOrderStatusEmail(updatedOrder).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supabase PATCH Order Error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}

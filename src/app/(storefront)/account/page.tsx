'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function AccountPage() {
  const { isLoggedIn, userPhone, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_phone', userPhone)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isLoggedIn, userPhone, router]);

  if (!isLoggedIn || loading) {
    return <div style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading profile...</div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-color)' }}>My Account</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Welcome back, +91 {userPhone}</p>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ background: 'none', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </header>

      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '20px', fontFamily: 'var(--font-serif)' }}>Order History</h2>
        
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px' }}>
            <p style={{ color: '#666', marginBottom: '20px' }}>You haven't placed any orders yet.</p>
            <Link href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {orders.map(order => (
              <div key={order.id} style={{ border: '1px solid #eaeaea', borderRadius: '8px', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 250px' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>{order.id}</p>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '15px' }}>Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                  <span style={{ display: 'inline-block', background: order.status === 'Pending' ? '#fff3cd' : '#d4edda', color: order.status === 'Pending' ? '#856404' : '#155724', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {order.status}
                  </span>
                </div>
                
                <div style={{ flex: '1 1 250px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Items</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem' }}>
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#666' }}>{item.quantity}x</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ flex: '1 1 150px', textAlign: 'right' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Total Amount</p>
                  <p style={{ fontSize: '1.2rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{order.total.toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

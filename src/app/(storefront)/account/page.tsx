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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders'>('dashboard');

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

    // Auto-refresh order statuses every 10 seconds
    const interval = setInterval(fetchOrders, 10000);

    return () => clearInterval(interval);
  }, [isLoggedIn, userPhone, router]);

  if (!isLoggedIn || loading) {
    return <div style={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading profile...</div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const customerName = orders.length > 0 && orders[0].customer_name ? orders[0].customer_name.split(' ')[0] : '';

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', minHeight: '60vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-color)' }}>My Account</h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Welcome back{customerName ? `, ${customerName}` : ''}! (+91 {userPhone})</p>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ background: 'none', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <button 
          onClick={() => setActiveTab('dashboard')} 
          style={{ padding: '10px 20px', background: activeTab === 'dashboard' ? 'var(--primary-color)' : '#f9f9f9', color: activeTab === 'dashboard' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('orders')} 
          style={{ padding: '10px 20px', background: activeTab === 'orders' ? 'var(--primary-color)' : '#f9f9f9', color: activeTab === 'orders' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          My Orders {orders.length > 0 && `(${orders.length})`}
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ padding: '40px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '15px' }}>Account Dashboard</h2>
          <p style={{ color: '#555', marginBottom: '20px', lineHeight: '1.6' }}>
            From your account dashboard you can view your recent orders, track packages, and manage your account details.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #eaeaea', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📦</div>
              <h3 style={{ marginBottom: '10px' }}>Track Orders</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Check the status of your recent purchases.</p>
              <button onClick={() => setActiveTab('orders')} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>View Orders</button>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #eaeaea', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👤</div>
              <h3 style={{ marginBottom: '10px' }}>Account Details</h3>
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>You are logged in with Mobile: +91 {userPhone}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
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
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '8px' }}>
                      {/* Background Line */}
                      <div style={{ position: 'absolute', top: '10px', left: '10%', right: '10%', height: '4px', background: '#eaeaea', zIndex: 1 }}></div>
                      
                      {/* Active Fill Line */}
                      <div style={{ 
                        position: 'absolute', top: '10px', left: '10%', height: '4px', background: 'var(--primary-color)', zIndex: 2, transition: 'width 0.5s ease',
                        width: order.status === 'Delivered' ? '80%' : order.status === 'Shipped' ? '53%' : order.status === 'Packed' ? '26%' : '0%' 
                      }}></div>

                      {['Placed', 'Packed', 'Shipped', 'Delivered'].map((step, idx) => {
                        const isActive = 
                          (step === 'Placed') ||
                          (step === 'Packed' && ['Packed', 'Shipped', 'Delivered'].includes(order.status)) ||
                          (step === 'Shipped' && ['Shipped', 'Delivered'].includes(order.status)) ||
                          (step === 'Delivered' && order.status === 'Delivered');
                        
                        return (
                          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, flex: 1 }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isActive ? 'var(--primary-color)' : '#eaeaea', color: isActive ? 'white' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', border: `3px solid white`, transition: 'all 0.3s' }}>
                              {isActive ? '✓' : ''}
                            </div>
                            <span style={{ fontSize: '0.75rem', marginTop: '5px', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#333' : '#999' }}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                    {order.status === 'Cancelled' && (
                       <p style={{ color: 'red', fontWeight: 'bold', textAlign: 'center', marginTop: '10px' }}>Order Cancelled</p>
                    )}
                    {order.shipping_address?.tracking && order.status !== 'Cancelled' && (
                      <div style={{ marginTop: '15px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Shipped via {order.shipping_address.tracking.courier}</p>
                          <p style={{ fontWeight: 'bold', margin: 0 }}>{order.shipping_address.tracking.trackingId}</p>
                        </div>
                        <a href={`https://www.google.com/search?q=${order.shipping_address.tracking.courier}+tracking+${order.shipping_address.tracking.trackingId}`} target="_blank" rel="noopener noreferrer" style={{ background: 'var(--primary-color)', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          Track Package
                        </a>
                      </div>
                    )}
                  </div>
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
      )}
    </div>
  );
}

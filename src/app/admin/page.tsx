'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabaseClient';

export default function AdminDashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [data, setData] = useState<any>({ categories: [], products: [], menus: [], customers: [], orders: [], siteSettings: { showHero: true, showQuickLinks: true, showTrending: true, showTopPicks: true } });
  const [activeTab, setActiveTab] = useState('orders'); // orders, inventory, categories, storefront, customers
  const [menuItems, setMenuItems] = useState<any[]>([{ name: '', href: '' }]);
  const [menuTitle, setMenuTitle] = useState('');
  // --- Inventory State ---
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', originalPrice: '', price: '', 
    mainCategory: '', subCategory: '', 
    isTrending: false, isNewArrival: true,
    isFreeShipping: true,
    description: '', 
    info: [
      { title: 'Product Care', content: 'Dry clean only. Do not bleach.' },
      { title: 'Shipping & Delivery', content: 'Dispatched within 24-48 hours. Delivery takes 3-5 business days.' },
      { title: 'Return Policies', content: '7-day easy returns if the product is defective or incorrect.' }
    ],
    variants: [{ color: '', sku: '', stock: 0, images: [] as string[] }]
  });
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
  const [hasMultipleVariants, setHasMultipleVariants] = useState(false);

  // --- Category State ---
  const [newMainCategory, setNewMainCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [targetMainCategory, setTargetMainCategory] = useState('');

  // --- Order Filter State ---
  const [orderFilterStatus, setOrderFilterStatus] = useState('Pending Orders');
  const [quickScanInput, setQuickScanInput] = useState('');
  const [quickScanResult, setQuickScanResult] = useState<any | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<any | null>(null);
  const [trackingData, setTrackingData] = useState({ courier: 'DTDC', trackingId: '' });
  const [printLabelOrder, setPrintLabelOrder] = useState<any | null>(null);

  useEffect(() => {
    if (printLabelOrder) {
      const handleAfterPrint = () => {
        setPrintLabelOrder(null);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [printLabelOrder]);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/orders').then(res => res.json())
    ]).then(([prodRes, ordRes]) => {
      setData({
        categories: prodRes.categories || [],
        products: prodRes.products || [],
        customers: prodRes.customers || [],
        orders: ordRes.orders || [],
        siteSettings: prodRes.siteSettings || { showHero: true, showQuickLinks: true, showTrending: true, showTopPicks: true }
      });
      if (prodRes.categories?.length > 0) {
        setFormData(f => ({ ...f, mainCategory: prodRes.categories[0].name, subCategory: '' }));
        setTargetMainCategory(prodRes.categories[0].name);
      }
    });

    // Auto-Sync polling for orders (Bulletproof replacement for Realtime)
    const interval = setInterval(async () => {
      try {
        const ordRes = await fetch('/api/orders').then(res => res.json());
        if (ordRes.orders) {
          setData((prevData: any) => ({
            ...prevData,
            orders: ordRes.orders
          }));
        }
      } catch (err) {
        console.error('Failed to poll orders', err);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // --- Image Upload Logic (Direct to Supabase to preserve full quality) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    if (!e.target.files?.length) return;
    setUploadingVariantIndex(variantIndex);
    
    try {
      const fileUrls: string[] = [];
      
      for (const file of Array.from(e.target.files)) {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        
        // Upload directly from browser to Supabase (bypasses Vercel limits entirely)
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false
          });

        if (error) {
          console.error("Supabase direct upload error:", error);
          throw error;
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        fileUrls.push(publicUrlData.publicUrl);
      }

      // Update state with new images
      setFormData(prev => {
        const newVariants = [...prev.variants];
        const existingImages = newVariants[variantIndex].images;
        const newUniqueImages = fileUrls.filter((url: string) => !existingImages.includes(url));
        newVariants[variantIndex].images = [...existingImages, ...newUniqueImages];
        return { ...prev, variants: newVariants };
      });
      
      e.target.value = ''; // Reset input
    } catch (err: any) {
      alert(`Direct Upload Failed: ${err.message}. Please ensure the Supabase Storage Policy allows public uploads.`);
    } finally {
      setUploadingVariantIndex(null);
    }
  };

  // --- Inventory Logic ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.variants.length === 0 || formData.variants[0].images.length === 0) {
      return alert("Please add at least one color variant with an image.");
    }

    const payload = {
      ...formData,
      originalPrice: Number(formData.originalPrice),
      price: Number(formData.price),
      discount: formData.originalPrice !== formData.price ? Math.round(((Number(formData.originalPrice) - Number(formData.price)) / Number(formData.originalPrice)) * 100) + '% OFF' : null,
      variants: formData.variants,
      info: formData.info.filter(i => i.title && i.content)
    };

    if (editingProductId) {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({ action: 'updateProduct', id: editingProductId, ...payload })
      });
      if (res.ok) {
        const result = await res.json();
        setData({ ...data, products: data.products.map((p: any) => p.id === editingProductId ? result.product : p) });
        setEditingProductId(null);
        alert("Product updated successfully!");
        setActiveTab('inventory');
      }
    } else {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        setData({ ...data, products: [...data.products, result.product] });
        alert("Product launched successfully!");
        setActiveTab('inventory');
      }
    }

    setFormData({
      name: '', originalPrice: '', price: '', 
      mainCategory: data.categories[0]?.name || '', 
      subCategory: '',
      isTrending: false, isNewArrival: true,
      isFreeShipping: true,
      description: '', 
      info: [
        { title: 'Product Care', content: 'Dry clean only. Do not bleach.' },
        { title: 'Shipping & Delivery', content: 'Dispatched within 24-48 hours. Delivery takes 3-5 business days.' },
        { title: 'Return Policies', content: '7-day easy returns if the product is defective or incorrect.' }
      ],
      variants: [{ color: '', sku: '', stock: 0, images: [] }]
    });
    setHasMultipleVariants(false);
  };

  const handleToggleVisibility = async (productId: string, currentStatus: boolean) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggleProductVisibility', id: productId, isVisible: !currentStatus })
    });
    if (res.ok) {
      setData({ ...data, products: data.products.map((p: any) => p.id === productId ? { ...p, isVisible: !currentStatus } : p) });
    }
  };

  const handleAddMainCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainCategory) return;
    const res = await fetch('/api/products', { method: 'POST', body: JSON.stringify({ action: 'addCategory', name: newMainCategory }) });
    if (res.ok) {
      const result = await res.json();
      setData({ ...data, categories: [...data.categories, result.category] });
      setNewMainCategory('');
      alert("Main Category Created");
    }
  };

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCategory || !targetMainCategory) return;
    const res = await fetch('/api/products', { method: 'POST', body: JSON.stringify({ action: 'addSubCategory', mainCategory: targetMainCategory, subCategory: newSubCategory }) });
    if (res.ok) {
      const updatedCategories = data.categories.map((c: any) => {
        if (c.name === targetMainCategory) {
          return { ...c, subcategories: [...(c.subcategories || []), newSubCategory] };
        }
        return c;
      });
      setData({ ...data, categories: updatedCategories });
      setNewSubCategory('');
      alert("Sub Category Added");
    }
  };

  // --- Navigation Builder Logic ---
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanItems = menuItems.filter(i => i.name && i.href);
    if (!menuTitle || cleanItems.length === 0) return alert('Need title and at least 1 item.');
    
    const res = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({ action: 'saveMenu', title: menuTitle, items: cleanItems })
    });
    if (res.ok) {
      const result = await res.json();
      setData({ ...data, menus: [...data.menus, result.menu] });
      setMenuTitle(''); setMenuItems([{ name: '', href: '' }]);
      alert('Menu created successfully!');
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string, trackingDataObj: any = null) => {
    let updatedOrder: any = { status: newStatus };
    
    setData({...data, orders: data.orders.map((o:any) => {
      if (o.id === orderId) {
        let newOrderObj = {...o, status: newStatus};
        if (trackingDataObj) {
          newOrderObj.shipping_address = { ...o.shipping_address, tracking: trackingDataObj };
          updatedOrder.shipping_address = newOrderObj.shipping_address;
        }
        return newOrderObj;
      }
      return o;
    })});
    
    await fetch('/api/orders', { method: 'PATCH', body: JSON.stringify({ id: orderId, ...updatedOrder }) });
  };

  const submitTracking = () => {
    if (!trackingModalOrder || !trackingData.trackingId) return alert('Please enter tracking number');
    handleOrderStatusChange(trackingModalOrder.id, 'Shipped', trackingData);
    setTrackingModalOrder(null);
    setTrackingData({ courier: 'DTDC', trackingId: '' });
  };

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanInput.trim()) return;
    const foundOrder = data.orders.find((o: any) => o.id.toLowerCase().includes(quickScanInput.toLowerCase().trim()));
    if (foundOrder) {
      setQuickScanResult(foundOrder);
    } else {
      alert(`Order ${quickScanInput} not found!`);
      setQuickScanResult(null);
    }
    setQuickScanInput('');
  };

  const closeQuickScan = () => {
    setQuickScanResult(null);
  };

  if (printLabelOrder) {
    return (
      <div className={styles.printOnly} style={{ position: 'relative', padding: '10px', boxSizing: 'border-box', backgroundColor: 'white', width: '4in', margin: '0' }}>
        
        {/* Force page margin 0 to hide browser headers/footers */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { margin: 0; size: 4in 6in; }
            body { margin: 0 !important; padding: 0 !important; background: white; }
          }
        `}} />

        <div style={{ fontFamily: 'Arial, sans-serif', color: 'black', position: 'relative', zIndex: 1 }}>
          
          {/* Header: Logo Left, Order Info Right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid black', paddingBottom: '15px', marginBottom: '15px' }}>
            <img src="/logo.png" style={{ height: '140px', objectFit: 'contain' }} alt="Avanthika Fashions" />
            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }}>ORDER: {printLabelOrder.id.replace('ORD-', '')}</div>
              <div style={{ display: 'inline-block', background: 'black', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                PREPAID
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                SKU(s): {printLabelOrder.items.map((i: any) => i.sku || i.id).join(', ')}
              </div>
              <div style={{ fontSize: '12px' }}>{new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>
          
          {/* Shipping Address */}
          <div style={{ border: '2px solid black', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', textTransform: 'uppercase', color: '#555' }}>Ship To:</div>
            
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#444' }}>Name:</span><br/>
              <span style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '0.5px' }}>{printLabelOrder.customer_name}</span>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#444' }}>Phone:</span><br/>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{printLabelOrder.customer_phone}</span>
            </div>

            <div style={{ fontSize: '16px', lineHeight: '1.4', marginTop: '8px' }}>
              {printLabelOrder.shipping_address?.address}<br/>
              {printLabelOrder.shipping_address?.city}, {printLabelOrder.shipping_address?.state}<br/>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>PIN: {printLabelOrder.shipping_address?.pin}</span>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', borderBottom: '2px solid black', paddingBottom: '2px', marginBottom: '4px' }}>ITEMS ENCLOSED</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                  <th style={{ padding: '2px 0' }}>Description</th>
                  <th style={{ padding: '2px 0', textAlign: 'center', width: '30px' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {printLabelOrder.items.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '4px 0', fontWeight: 'bold' }}>
                      {item.name} {item.size !== 'Standard' && `(${item.size})`}
                    </td>
                    <td style={{ padding: '4px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Cost Breakdown */}
          <div style={{ borderTop: '2px solid black', paddingTop: '5px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Subtotal:</span>
              <span>₹{printLabelOrder.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Shipping:</span>
              <span>₹{printLabelOrder.shipping_cost}</span>
            </div>
            {printLabelOrder.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Discount:</span>
                <span>-₹{printLabelOrder.discount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginTop: '3px', paddingTop: '3px', borderTop: '1px solid black' }}>
              <span>TOTAL:</span>
              <span>₹{printLabelOrder.total}</span>
            </div>
          </div>
          
          {/* Barcode */}
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <img src={`https://barcodeapi.org/api/128/${printLabelOrder.id}`} style={{ height: '40px', maxWidth: '100%' }} alt="Barcode" />
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      
      {/* Mobile Top Bar */}
      <div className={styles.mobileTopBar}>
        <button 
          className={styles.hamburger} 
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open Menu"
        >
          ☰
        </button>
        <div className={styles.mobileBrand}>Avanthika Admin</div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileSidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setIsMobileSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ''}`}>
        <button 
          className={styles.closeSidebar} 
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          ✕
        </button>
        <div className={styles.brand} style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Avanthika Fashions" 
            style={{ width: '200px', height: '80px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
          />
        </div>
        <nav className={styles.navLinks}>
          <button className={activeTab === 'orders' ? styles.active : ''} onClick={() => {setActiveTab('orders'); setIsMobileSidebarOpen(false);}}>🚚 Orders & Dispatch</button>
          <button className={activeTab === 'inventory' ? styles.active : ''} onClick={() => {setActiveTab('inventory'); setIsMobileSidebarOpen(false);}}>📦 Manage Inventory</button>
          <button className={activeTab === 'add-product' ? styles.active : ''} onClick={() => {setActiveTab('add-product'); setIsMobileSidebarOpen(false);}}>➕ Add Product</button>
          <button className={activeTab === 'categories' ? styles.active : ''} onClick={() => {setActiveTab('categories'); setIsMobileSidebarOpen(false);}}>🏷️ Manage Categories</button>
          <button className={activeTab === 'storefront' ? styles.active : ''} onClick={() => {setActiveTab('storefront'); setIsMobileSidebarOpen(false);}}>⚙️ Storefront Settings</button>
          <button className={activeTab === 'customers' ? styles.active : ''} onClick={() => {setActiveTab('customers'); setIsMobileSidebarOpen(false);}}>👥 Customer Intelligence</button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        
        {activeTab === 'orders' && (
          <div className={styles.tabContent}>
            <header className={styles.tabHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1>Orders & Dispatch Pipeline</h1>
                <p>Move orders through the fulfillment stages to keep tracking accurate.</p>
              </div>
              <form onSubmit={handleQuickScan} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Scan or Enter Order ID..." 
                  value={quickScanInput}
                  onChange={(e) => setQuickScanInput(e.target.value)}
                  className={styles.input}
                  style={{ width: '250px' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>Search</button>
              </form>
            </header>

            {quickScanResult && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                  <h2 style={{ marginTop: 0 }}>Quick Update</h2>
                  <p><strong>Order ID:</strong> {quickScanResult.id}</p>
                  <p><strong>Customer:</strong> {quickScanResult.customer_name}</p>
                  <p><strong>Current Status:</strong> <span style={{ padding: '3px 8px', background: '#f0f0f0', borderRadius: '4px', fontWeight: 'bold' }}>{quickScanResult.status}</span></p>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '25px', flexWrap: 'wrap' }}>
                    {(quickScanResult.status === 'Pending' || quickScanResult.status === 'Pending Payment' || quickScanResult.status === 'New') && (
                      <button onClick={() => { handleOrderStatusChange(quickScanResult.id, 'Packed'); closeQuickScan(); }} style={{ flex: 1, padding: '12px', background: '#fef3c7', border: '1px solid #d97706', color: '#d97706', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>👍 Acknowledge & Process</button>
                    )}
                    {(quickScanResult.status === 'Packed') && (
                      <button onClick={() => { setTrackingModalOrder(quickScanResult); closeQuickScan(); }} style={{ flex: 1, padding: '12px', background: '#dbeafe', border: '1px solid #2563eb', color: '#1d4ed8', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>📦 Dispatch & Add Tracking</button>
                    )}
                  </div>
                  <button onClick={closeQuickScan} style={{ width: '100%', marginTop: '15px', padding: '10px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>Close</button>
                </div>
              </div>
            )}

            {trackingModalOrder && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                  <h2 style={{ marginTop: 0 }}>Dispatch Order: {trackingModalOrder.id}</h2>
                  <p>Enter the tracking details below. The customer will be notified.</p>
                  
                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Courier Service</label>
                    <select 
                      value={trackingData.courier}
                      onChange={(e) => setTrackingData({...trackingData, courier: e.target.value})}
                      className={styles.input}
                      style={{ width: '100%', marginBottom: '15px' }}
                    >
                      <option value="DTDC">DTDC</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="BlueDart">BlueDart</option>
                      <option value="Shiprocket">Shiprocket (Other)</option>
                    </select>

                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tracking Number (AWB)</label>
                    <input 
                      type="text" 
                      value={trackingData.trackingId}
                      onChange={(e) => setTrackingData({...trackingData, trackingId: e.target.value})}
                      className={styles.input}
                      placeholder="e.g. D12345678"
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                    <button onClick={() => setTrackingModalOrder(null)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={submitTracking} style={{ flex: 1, padding: '12px', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #2563eb', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save & Dispatch</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
              {['Pending Orders', 'Dispatched', 'Delivered', 'Cancelled'].map(status => {
                const mapStatus = status === 'Dispatched' ? 'Shipped' : status === 'Pending Orders' ? 'Packed' : status;
                const count = data.orders.filter((o: any) => o.status === mapStatus || (status === 'Pending Orders' && (o.status === 'Pending' || o.status === 'Pending Payment' || o.status === 'New'))).length;
                return (
                <button
                  key={status}
                  onClick={() => setOrderFilterStatus(status)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: orderFilterStatus === status ? 'var(--primary-color)' : '#ddd',
                    background: orderFilterStatus === status ? 'var(--primary-color)' : 'white',
                    color: orderFilterStatus === status ? 'white' : '#666',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {status} 
                  {status !== 'All' && ` (${count})`}
                </button>
                );
              })}
            </div>
            
            <div className={styles.card}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order Details</th>
                    <th>Customer & Delivery</th>
                    <th>Items to Pack</th>
                    <th>Amount & Payment</th>
                    <th>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders
                    .filter((o: any) => {
                      if (orderFilterStatus === 'Pending Orders') return o.status === 'Pending' || o.status === 'Pending Payment' || o.status === 'New' || o.status === 'Packed';
                      if (orderFilterStatus === 'Dispatched') return o.status === 'Shipped';
                      return o.status === orderFilterStatus;
                    })
                    .map((order: any) => (
                    <tr key={order.id}>
                      <td style={{verticalAlign: 'top'}}>
                        <strong>{order.id}</strong><br/>
                        <span style={{fontSize: '0.85rem', color: '#666'}}>{new Date(order.created_at).toLocaleString()}</span>
                      </td>
                      <td style={{verticalAlign: 'top'}}>
                        <div style={{ background: '#fcfcfc', padding: '15px', borderRadius: '6px', border: '1px solid #eaeaea', fontSize: '0.85rem' }}>
                          <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)', fontSize: '0.95rem' }}>Customer Details</h4>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
                            <li><strong>Full Name:</strong> {order.customer_name}</li>
                            <li><strong>Phone Number:</strong> {order.customer_phone}</li>
                            <li><strong>Email Address:</strong> {order.customer_email || 'N/A'}</li>
                            <li><strong>Delivery Address:</strong> {order.shipping_address?.address}</li>
                            <li><strong>City:</strong> {order.shipping_address?.city}</li>
                            <li><strong>State:</strong> {order.shipping_address?.state}</li>
                            <li><strong>PIN code:</strong> {order.shipping_address?.pin}</li>
                          </ul>
                        </div>
                      </td>
                      <td style={{verticalAlign: 'top'}}>
                        <ul style={{margin: 0, paddingLeft: '15px', fontSize: '0.9rem'}}>
                          {order.items.map((item: any, idx: number) => (
                            <li key={idx} style={{marginBottom: '5px'}}>
                              <strong>{item.quantity}x</strong> {item.name} 
                              {item.size !== 'Standard' && ` (${item.size})`} 
                              <br/><span style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>SKU: {item.sku || item.id}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td style={{verticalAlign: 'top'}}>
                        <strong>₹{order.total}</strong><br/>
                        <span style={{fontSize: '0.85rem', color: order.payment_method === 'cod' ? '#d97706' : '#059669', background: order.payment_method === 'cod' ? '#fef3c7' : '#d1fae5', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'}}>{order.payment_method}</span>
                      </td>
                      <td style={{verticalAlign: 'top'}}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(order.status === 'Pending' || order.status === 'Pending Payment' || order.status === 'New' || order.status === 'Packed') && (
                            <>
                              <button 
                                onClick={() => setTrackingModalOrder(order)}
                                style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #2563eb', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#bfdbfe'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#dbeafe'}
                              >
                                📦 Dispatch & Add Tracking
                              </button>
                              <button 
                                onClick={() => setPrintLabelOrder(order)}
                                style={{ background: '#f3e8ff', color: '#7e22ce', border: '1px solid #9333ea', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', width: '100%', marginTop: '5px' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#e9d5ff'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#f3e8ff'}
                              >
                                🖨️ Print Label
                              </button>
                            </>
                          )}

                          {order.status === 'Shipped' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'center' }}>
                              <span style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                📡 Awaiting Courier Delivery
                              </span>
                              <button 
                                onClick={() => handleOrderStatusChange(order.id, 'Delivered')}
                                style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                title="Use this until Courier API is fully integrated"
                              >
                                (Force manual delivery)
                              </button>
                            </div>
                          )}

                          {(order.status === 'Delivered' || order.status === 'Cancelled') && (
                            <span style={{ 
                              display: 'inline-block', textAlign: 'center', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold',
                              background: order.status === 'Delivered' ? '#d1fae5' : '#fee2e2',
                              color: order.status === 'Delivered' ? '#047857' : '#b91c1c',
                              border: `1px solid ${order.status === 'Delivered' ? '#059669' : '#dc2626'}`
                            }}>
                              {order.status === 'Delivered' ? '✅ Delivered' : '❌ Cancelled'}
                            </span>
                          )}

                          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel this order?')) {
                                  handleOrderStatusChange(order.id, 'Cancelled');
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', marginTop: '4px' }}
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.orders.length === 0 && (
                    <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>No orders found.</td></tr>
                  )}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className={styles.tabContent}>
            <header className={styles.tabHeader}>
              <h1>Manage Inventory</h1>
              <p>Add new products or edit existing ones.</p>
            </header>

            <div className={styles.card} style={{ marginBottom: '30px' }}>
              <h2 style={{fontSize: '1.2rem', marginBottom: '15px'}}>Current Products</h2>
              {data.products.length === 0 ? (
                <p>No products yet.</p>
              ) : (
                <div className={styles.tableWrapper}>
                  {Array.from(new Set(data.products.map((p: any) => p.mainCategory))).map((categoryName: any) => (
                    <div key={categoryName} style={{ marginBottom: '30px' }}>
                      <h3 style={{ padding: '10px', background: '#f0f0f0', borderLeft: '4px solid var(--primary-color)', margin: '0 0 10px 0' }}>{categoryName}</h3>
                      <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Visibility</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.products.filter((p: any) => p.mainCategory === categoryName).map((p: any) => (
                        <tr key={p.id}>
                          <td>
                            <img src={p.variants[0]?.images[0] || '/placeholder.jpg'} alt={p.name} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}} />
                          </td>
                          <td><strong>{p.name}</strong><br/><span style={{fontSize: '0.8rem', color: '#666'}}>ID: {p.id}</span></td>
                          <td>₹{p.price}</td>
                          <td>{p.mainCategory} &gt; {p.subCategory}</td>
                          <td>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                              <input 
                                type="checkbox" 
                                checked={p.isVisible !== false} 
                                onChange={() => handleToggleVisibility(p.id, p.isVisible !== false)}
                              />
                              <span style={{ fontSize: '0.9rem', color: p.isVisible !== false ? 'green' : '#999' }}>
                                {p.isVisible !== false ? 'Live' : 'Hidden'}
                              </span>
                            </label>
                          </td>
                          <td>
                            <button 
                              onClick={() => {
                                setEditingProductId(p.id);
                                setFormData({
                                  name: p.name,
                                  originalPrice: p.originalPrice.toString(),
                                  price: p.price.toString(),
                                  mainCategory: p.mainCategory,
                                  subCategory: p.subCategory,
                                  isTrending: p.isTrending || false,
                                  isNewArrival: p.isNewArrival || false,
                                  isFreeShipping: p.isFreeShipping !== false,
                                  description: p.description || '',
                                  info: p.info || [],
                                  variants: p.variants || [{ color: '', sku: '', stock: 0, images: [] }]
                                });
                                setActiveTab('add-product');
                              }}
                              style={{padding: '5px 10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'add-product' && (
          <div className={styles.tabContent}>
            <header className={styles.tabHeader}>
              <h1>{editingProductId ? 'Edit Product' : 'Launch New Product'}</h1>
              <p>{editingProductId ? 'Modify the product details below and save changes.' : 'Fill out the details and upload actual photos to launch a product to the live site.'}</p>
            </header>
            
            <div className={styles.grid2Col}>
              <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{editingProductId ? 'Edit Details' : 'Product Details'}</h2>
                  {editingProductId && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingProductId(null);
                        setFormData({
                          name: '', originalPrice: '', price: '', 
                          mainCategory: data.categories[0]?.name || '', subCategory: '',
                          isTrending: false, isNewArrival: true, isFreeShipping: true, description: '', 
                          info: [
                            { title: 'Product Care', content: 'Dry clean only. Do not bleach.' },
                            { title: 'Shipping & Delivery', content: 'Dispatched within 24-48 hours. Delivery takes 3-5 business days.' },
                            { title: 'Return Policies', content: '7-day easy returns if the product is defective or incorrect.' }
                          ],
                          variants: [{ color: '', sku: '', stock: 0, images: [] }]
                        });
                      }}
                      style={{ background: 'none', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <form onSubmit={handleAddProduct} className={styles.form}>
                  
                  {/* explicit labels */}
                  <div className={styles.fieldGroup}>
                    <label>Product Name</label>
                    <input className={styles.input} type="text" placeholder="e.g. Royal Banarasi Silk" required value={formData.name} onChange={e => {
                      const titleCased = e.target.value.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                      setFormData({...formData, name: titleCased});
                    }} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label>Original Strike Price (INR)</label>
                      <input className={styles.input} type="number" placeholder="e.g. 15000" required value={formData.originalPrice} onChange={e => setFormData({...formData, originalPrice: e.target.value})} />
                      <span className={styles.helper}>This price will be crossed out.</span>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Discounted Selling Price (INR)</label>
                      <input className={styles.input} type="number" placeholder="e.g. 8500" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                      <span className={styles.helper}>The actual price the customer pays.</span>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 0', fontWeight: 'bold'}}>
                        <input type="checkbox" checked={formData.isFreeShipping} onChange={e => setFormData({...formData, isFreeShipping: e.target.checked})} style={{width: '20px', height: '20px'}} />
                        Offer Free Standard Shipping for this product
                      </label>
                    </div>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                      <label>Main Category</label>
                      <select className={styles.input} value={formData.mainCategory} onChange={e => {
                        const newMain = e.target.value;
                        setFormData({...formData, mainCategory: newMain, subCategory: ''});
                      }}>
                        {data.categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Weave (Optional)</label>
                      <select className={styles.input} value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})}>
                        <option value="">-- Not Applicable --</option>
                        {data.categories.find((c:any) => c.name === formData.mainCategory)?.subcategories?.map((sub: string, i: number) => (
                           <option key={i} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label>Product Description</label>
                    <textarea className={styles.input} placeholder="Tell the story behind this piece..." rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>

                  {/* Dynamic Product Info (Sliders) */}
                  <div className={styles.uploadZone}>
                    <h3 style={{fontSize: '1rem', marginBottom: '10px'}}>Product Accordions (Sliders)</h3>
                    {formData.info.map((section, idx) => (
                      <div key={idx} className={styles.row} style={{marginBottom: '10px'}}>
                        <input 
                          className={styles.input} type="text" placeholder="Title (e.g. Wash Care)" 
                          value={section.title} 
                          onChange={e => {
                            const newInfo = [...formData.info]; newInfo[idx].title = e.target.value; setFormData({...formData, info: newInfo});
                          }} 
                        />
                        <textarea 
                          className={styles.input} placeholder="Content details (Use Enter or period for bullet points)..." rows={2}
                          value={section.content} 
                          onChange={e => {
                            const newInfo = [...formData.info]; newInfo[idx].content = e.target.value; setFormData({...formData, info: newInfo});
                          }} 
                        />
                        <button type="button" onClick={() => setFormData({...formData, info: formData.info.filter((_, i) => i !== idx)})} className={styles.outlineBtn} style={{padding: '0 10px', color: 'red', border: 'none'}}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData({...formData, info: [...formData.info, {title: '', content: ''}]})} className={styles.outlineBtn} style={{fontSize: '0.8rem'}}>+ Add Section</button>
                  </div>

                  {/* Proper Image Upload Zone (Color Variants) */}
                  <div className={styles.uploadZone}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                      <h3 style={{fontSize: '1rem', margin: 0}}>Product Images & Variants</h3>
                      <label style={{fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'}}>
                        <input type="checkbox" checked={hasMultipleVariants} onChange={(e) => setHasMultipleVariants(e.target.checked)} />
                        Product has multiple colors/variants
                      </label>
                    </div>
                    
                    <p className={styles.helper} style={{marginBottom: '10px'}}>
                      Upload 9:16 aspect ratio images (e.g. 1080x1920) for best display.
                    </p>
                    
                    {formData.variants.map((variant, idx) => (
                      <div key={idx} style={{padding: '15px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', background: '#fff'}}>
                        {hasMultipleVariants && (
                          <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                              <label>Color Name</label>
                              <input 
                                className={styles.input} type="text" placeholder="e.g. Ruby Red" 
                                value={variant.color} required={hasMultipleVariants}
                                onChange={e => {
                                  const titleCased = e.target.value.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                                  const newVars = [...formData.variants]; newVars[idx].color = titleCased; setFormData({...formData, variants: newVars});
                                }} 
                              />
                            </div>
                            <div className={styles.fieldGroup}>
                              <label>Specific SKU for this Color</label>
                              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                <div style={{display: 'flex', alignItems: 'center', background: '#f5f5f5', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0 15px', flex: 1}}>
                                  <span style={{fontWeight: 'bold', color: '#666', marginRight: '5px'}}>SKU-</span>
                                  <input 
                                    type="text" placeholder="123456" maxLength={6}
                                    value={variant.sku.replace('SKU-', '')} required={hasMultipleVariants}
                                    style={{border: 'none', background: 'transparent', outline: 'none', padding: '12px 0', width: '100%', fontSize: '1rem'}}
                                    onChange={e => {
                                      const sanitizedValue = e.target.value.replace(/[^0-9]/g, '');
                                      const newVars = [...formData.variants]; 
                                      newVars[idx].sku = sanitizedValue ? `SKU-${sanitizedValue}` : ''; 
                                      setFormData({...formData, variants: newVars});
                                    }} 
                                  />
                                </div>
                              </div>
                            </div>
                            <div className={styles.fieldGroup}>
                              <label>Stock Quantity</label>
                              <input 
                                type="number" min="0" placeholder="e.g. 10" 
                                value={variant.stock === undefined ? 0 : variant.stock} required
                                className={styles.input}
                                onChange={e => {
                                  const newVars = [...formData.variants]; 
                                  newVars[idx].stock = parseInt(e.target.value) || 0; 
                                  setFormData({...formData, variants: newVars});
                                }} 
                              />
                            </div>
                            <div className={styles.fieldGroup} style={{display: 'flex', alignItems: 'flex-end', paddingBottom: '5px'}}>
                              {formData.variants.length > 1 && (
                                <button type="button" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== idx)})} style={{background: 'none', border: 'none', color: 'red', cursor: 'pointer', minWidth: '70px'}}>Remove</button>
                              )}
                            </div>
                          </div>
                        )}

                        {!hasMultipleVariants && (
                          <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                              <label>Product SKU</label>
                              <div style={{display: 'flex', alignItems: 'center', background: '#f5f5f5', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0 15px', maxWidth: '300px'}}>
                                <span style={{fontWeight: 'bold', color: '#666', marginRight: '5px'}}>SKU-</span>
                                <input 
                                  type="text" placeholder="123456" maxLength={6}
                                  value={variant.sku.replace('SKU-', '')} required={!hasMultipleVariants}
                                  style={{border: 'none', background: 'transparent', outline: 'none', padding: '12px 0', width: '100%', fontSize: '1rem'}}
                                  onChange={e => {
                                    const sanitizedValue = e.target.value.replace(/[^0-9]/g, '');
                                    const newVars = [...formData.variants]; 
                                    newVars[idx].sku = sanitizedValue ? `SKU-${sanitizedValue}` : ''; 
                                    setFormData({...formData, variants: newVars});
                                  }} 
                                />
                              </div>
                            </div>
                            <div className={styles.fieldGroup}>
                              <label>Stock Quantity</label>
                              <input 
                                type="number" min="0" placeholder="e.g. 10" 
                                value={variant.stock === undefined ? 0 : variant.stock} required={!hasMultipleVariants}
                                className={styles.input}
                                onChange={e => {
                                  const newVars = [...formData.variants]; 
                                  newVars[idx].stock = parseInt(e.target.value) || 0; 
                                  setFormData({...formData, variants: newVars});
                                }} 
                              />
                            </div>
                          </div>
                        )}

                        <div className={styles.fieldGroup} style={{marginTop: hasMultipleVariants ? '10px' : '0'}}>
                          <label>Upload Images {hasMultipleVariants ? `for ${variant.color || 'this color'}` : ''} (Unlimited)</label>
                          <input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e, idx)} className={styles.fileInput} />
                          {uploadingVariantIndex === idx && <p className={styles.helper}>Uploading securely to server...</p>}
                          
                          <div className={styles.imagePreviewGrid}>
                            {variant.images.map((img, i) => (
                              <div key={i} className={styles.previewBox}>
                                <img src={img} alt={`Preview ${i}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}

                    {hasMultipleVariants && (
                      <button type="button" onClick={() => setFormData({...formData, variants: [...formData.variants, {color: '', sku: '', stock: 0, images: []}]})} className="btn-secondary" style={{width: 'auto'}}>+ Add Another Color</button>
                    )}
                  </div>

                  <button type="submit" className={`btn-primary ${styles.submitBtn}`}>
                    {editingProductId ? 'Save Changes' : 'Launch Product Live'}
                  </button>
                </form>
              </div>

              <div className={styles.card}>
                <h2>Live Products ({data.products.length})</h2>
                <div style={{display: 'grid', gap: '15px', marginTop: '15px'}}>
                  {data.categories.map((cat: any) => (
                    <div key={cat.id}>
                      <h3 style={{fontSize: '1rem', color: 'var(--primary-color)', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px'}}>{cat.name}</h3>
                      <ul className={styles.simpleList}>
                        {data.products.filter((p: any) => p.mainCategory === cat.name).map((p: any) => (
                          <li key={p.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '10px', borderRadius: '4px', marginBottom: '5px'}}>
                            <div>
                              <strong>{p.name}</strong><br/>
                              <span className={styles.helper}>Rs.{p.price} | {p.variants?.[0]?.sku || p.sku} | Total Stock: {p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0} | {p.isFreeShipping !== false ? 'Free Shipping' : '+ Shipping'}</span>
                            </div>
                            <a href={`/products/${p.slug}`} target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'underline', fontWeight: 'bold'}}>View Live ↗</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storefront' && (
          <div className={styles.tabContent}>
            <header className={styles.tabHeader}>
              <h1>Storefront Settings</h1>
              <p>Toggle homepage sections ON or OFF instantly.</p>
            </header>
            <div className={styles.card} style={{ maxWidth: '600px' }}>
               {data.siteSettings && Object.keys(data.siteSettings).map(key => {
                  const labelMap: any = {
                    showHero: 'Hero Banner Section',
                    showQuickLinks: 'Quick Links Block',
                    showTrending: 'Trending Category Section',
                    showTopPicks: 'Top Picks Section',
                    promo1: 'Promo Card: Under 999',
                    promo2: 'Promo Card: Under 1499',
                    promo3: 'Promo Card: Office Wear',
                    promo4: 'Promo Card: Wedding Collection'
                  };
                  return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{labelMap[key] || key}</span>
                    <button 
                      onClick={async () => {
                        const newSettings = { ...data.siteSettings, [key]: !data.siteSettings[key] };
                        setData({...data, siteSettings: newSettings});
                        await fetch('/api/products', { method: 'POST', body: JSON.stringify({ action: 'updateSettings', settings: newSettings }) });
                      }}
                      style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', backgroundColor: data.siteSettings[key] ? 'var(--primary-color)' : '#ccc', color: 'white', fontWeight: 'bold' }}
                    >
                      {data.siteSettings[key] ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  );
               })}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className={styles.tabContent}>
             <header className={styles.tabHeader}>
              <h1>Manage Collections</h1>
              <p>Create and manage your Main Fabrics and specific Weaves.</p>
            </header>
            
            <div className={styles.grid2Col}>
              <div className={styles.card}>
                <h2 style={{fontSize: '1.2rem', marginBottom: '15px'}}>Create New Fabric</h2>
                <form onSubmit={handleAddMainCategory} className={styles.row}>
                  <div className={styles.fieldGroup} style={{flex: 1}}>
                    <input className={styles.input} type="text" placeholder="e.g. Designer Wear" value={newMainCategory} onChange={e => setNewMainCategory(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{alignSelf: 'flex-start', height: '44px'}}>Add Fabric</button>
                </form>

                <h2 style={{fontSize: '1.2rem', marginTop: '40px', marginBottom: '15px'}}>Create New Weave</h2>
                <form onSubmit={handleAddSubCategory} className={styles.colStack}>
                  <div className={styles.fieldGroup}>
                    <label>Under Fabric:</label>
                    <select className={styles.input} value={targetMainCategory} onChange={e => setTargetMainCategory(e.target.value)}>
                       {data.categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.row}>
                    <input className={styles.input} type="text" placeholder="e.g. Chiffon Designer" value={newSubCategory} onChange={e => setNewSubCategory(e.target.value)} required />
                    <button type="submit" className="btn-primary" style={{width: 'auto'}}>Add Weave</button>
                  </div>
                </form>
              </div>
              
              <div className={styles.card}>
                <h2 style={{fontSize: '1.2rem', marginBottom: '20px'}}>Active Collections</h2>
                {data.categories.map((c: any) => (
                  <div key={c.id} style={{marginBottom: '20px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '10px', borderRadius: '4px'}}>
                      <strong style={{color: 'var(--primary-color)'}}>{c.name}</strong>
                      <button 
                        onClick={async () => {
                          const newStatus = c.isVisible === false ? true : false;
                          const updatedCats = data.categories.map((cat:any) => cat.id === c.id ? {...cat, isVisible: newStatus} : cat);
                          setData({...data, categories: updatedCats});
                          await fetch('/api/products', { method: 'POST', body: JSON.stringify({ action: 'toggleCategory', id: c.id, isVisible: newStatus }) });
                        }}
                        style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', backgroundColor: c.isVisible !== false ? 'var(--primary-color)' : '#eee', color: c.isVisible !== false ? 'white' : '#666', fontSize: '0.8rem', fontWeight: 'bold' }}
                      >
                        {c.isVisible !== false ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <ul style={{marginTop: '10px', listStyle: 'disc', paddingLeft: '20px', color: '#666'}}>
                      {c.subcategories?.map((sub: string, i: number) => <li key={i}>{sub}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className={styles.tabContent}>
            <header className={styles.tabHeader}>
              <h1>Customer Intelligence</h1>
              <p>View verified users and OTP registrations.</p>
            </header>
            
            <div className={styles.card}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Mobile Number</th>
                      <th>Status</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((c: any) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.mobile}</td>
                        <td>{c.verified ? <span className={styles.tagGreen}>Verified OTP</span> : <span className={styles.tagPending}>Pending</span>}</td>
                        <td>{c.joined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

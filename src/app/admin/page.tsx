'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import NextImage from 'next/image';

export default function AdminDashboard() {
  const [data, setData] = useState<any>({ categories: [], products: [], menus: [], customers: [], siteSettings: { showHero: true, showQuickLinks: true, showTrending: true, showTopPicks: true } });
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, categories, navigation, customers
  const [menuItems, setMenuItems] = useState<any[]>([{ name: '', href: '' }]);
  const [menuTitle, setMenuTitle] = useState('');
  
  // --- Inventory State ---
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
    variants: [{ color: '', sku: '', images: [] as string[] }]
  });
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null);
  const [hasMultipleVariants, setHasMultipleVariants] = useState(false);

  // --- Category State ---
  const [newMainCategory, setNewMainCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [targetMainCategory, setTargetMainCategory] = useState('');

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(res => {
      setData({
        categories: res.categories || [],
        products: res.products || [],
        customers: res.customers || [],
        siteSettings: res.siteSettings || { showHero: true, showQuickLinks: true, showTrending: true, showTopPicks: true }
      });
      if (res.categories?.length > 0) {
        setFormData(f => ({ ...f, mainCategory: res.categories[0].name, subCategory: res.categories[0].subcategories?.[0] || '' }));
        setTargetMainCategory(res.categories[0].name);
      }
    });
  }, []);

  // --- Image Upload Logic ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIndex: number) => {
    if (!e.target.files?.length) return;
    setUploadingVariantIndex(variantIndex);
    
    const uploadData = new FormData();
    Array.from(e.target.files).forEach(file => uploadData.append('files', file));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: uploadData });
      if (res.ok) {
        const result = await res.json();
        setFormData(prev => {
          const newVariants = [...prev.variants];
          // Ensure no duplicate URLs are added
          const existingImages = newVariants[variantIndex].images;
          const newUniqueImages = result.urls.filter((url: string) => !existingImages.includes(url));
          newVariants[variantIndex].images = [...existingImages, ...newUniqueImages];
          return { ...prev, variants: newVariants };
        });
        // Clear input to prevent double firing or allow re-upload of same file
        e.target.value = '';
      } else {
        alert("Upload failed.");
      }
    } catch (err) {
      alert("Error connecting to upload server.");
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

    const res = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        originalPrice: Number(formData.originalPrice),
        price: Number(formData.price),
        discount: formData.originalPrice !== formData.price ? Math.round(((Number(formData.originalPrice) - Number(formData.price)) / Number(formData.originalPrice)) * 100) + '% OFF' : null,
        variants: formData.variants, // Replaces images/colors
        info: formData.info.filter(i => i.title && i.content) // Only save filled sliders
      })
    });
    if (res.ok) {
      const result = await res.json();
      setData({ ...data, products: [...data.products, result.product] });
      // Reset form
      setFormData({
        name: '', originalPrice: '', price: '', 
        mainCategory: data.categories[0]?.name || '', 
        subCategory: data.categories[0]?.subcategories?.[0] || '',
        isTrending: false, isNewArrival: true,
        isFreeShipping: true,
        description: '', 
        info: [
          { title: 'Product Care', content: 'Dry clean only. Do not bleach.' },
          { title: 'Shipping & Delivery', content: 'Dispatched within 24-48 hours. Delivery takes 3-5 business days.' },
          { title: 'Return Policies', content: '7-day easy returns if the product is defective or incorrect.' }
        ],
        variants: [{ color: '', sku: '', images: [] }]
      });
      setHasMultipleVariants(false);
      alert('Product Launched!');
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

  return (
    <div className={styles.dashboard}>
      
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand} style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
          <NextImage 
            src="/logo.png" 
            alt="Avanthika Fashions" 
            width={240} 
            height={100} 
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
            unoptimized 
            priority 
          />
        </div>
        <nav className={styles.navLinks}>
          <button className={activeTab === 'inventory' ? styles.active : ''} onClick={() => setActiveTab('inventory')}>📦 Add Product</button>
          <button className={activeTab === 'categories' ? styles.active : ''} onClick={() => setActiveTab('categories')}>🏷️ Manage Categories</button>
          <button className={activeTab === 'storefront' ? styles.active : ''} onClick={() => setActiveTab('storefront')}>⚙️ Storefront Settings</button>
          <button className={activeTab === 'customers' ? styles.active : ''} onClick={() => setActiveTab('customers')}>👥 Customer Intelligence</button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        
        {activeTab === 'inventory' && (
          <div className={styles.tabContent}>
            <header className={styles.tabHeader}>
              <h1>Launch New Product</h1>
              <p>Fill out the details and upload actual photos to launch a product to the live site.</p>
            </header>
            
            <div className={styles.grid2Col}>
              <div className={styles.card}>
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
                        const cat = data.categories.find((c:any) => c.name === newMain);
                        setFormData({...formData, mainCategory: newMain, subCategory: cat?.subcategories?.[0] || ''});
                      }}>
                        {data.categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label>Weave</label>
                      <select className={styles.input} value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})}>
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
                                {formData.variants.length > 1 && (
                                  <button type="button" onClick={() => setFormData({...formData, variants: formData.variants.filter((_, i) => i !== idx)})} style={{background: 'none', border: 'none', color: 'red', cursor: 'pointer', minWidth: '70px'}}>Remove</button>
                                )}
                              </div>
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
                      <button type="button" onClick={() => setFormData({...formData, variants: [...formData.variants, {color: '', sku: '', images: []}]})} className="btn-secondary" style={{width: 'auto'}}>+ Add Another Color</button>
                    )}
                  </div>

                  <button type="submit" className="btn-primary" style={{marginTop: '20px'}}>Launch Product</button>
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
                              <span className={styles.helper}>Rs.{p.price} | {p.variants?.[0]?.sku || p.sku} | {p.isFreeShipping !== false ? 'Free Shipping' : '+ Shipping'}</span>
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
               {data.siteSettings && Object.keys(data.siteSettings).map(key => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{key.replace('show', '')} Section</span>
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
               ))}
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
        )}

      </main>
    </div>
  );
}

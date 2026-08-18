'use client';

import { useState } from 'react';
import ProductGallery from './ProductGallery';
import AddToCartLogic from './AddToCartLogic';
import styles from '../app/(storefront)/products/[slug]/page.module.css';

export default function ProductDetailsClient({ product, fomoThreshold = 10 }: { product: any, fomoThreshold?: number }) {
  // Backwards compatibility for old database format
  const variants = product.variants && product.variants.length > 0 
    ? product.variants 
    : [{ color: 'Default', images: product.images || [] }];

  const [activeIndex, setActiveIndex] = useState(0);
  const selectedVariant = variants[activeIndex];

  return (
    <>
      {/* Interactive Gallery Component updates based on selected variant */}
      <ProductGallery images={selectedVariant.images} />
      
      {/* Info Section */}
      <div className={styles.infoSection}>
        <h1 className={styles.title} style={{ textTransform: 'capitalize', marginBottom: '10px' }}>{product.name}</h1>
        {/* Description is moved to the accordion below */}

        {/* Removed hidden title */}

        {/* Color Selection UI (Image Thumbnails) */}
        {variants.length > 1 && variants[0].color !== 'Default' && (
          <div className={styles.colorsSection} style={{ marginTop: '20px' }}>
            <p className={styles.colorsLabel} style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '10px' }}>More Colors</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {variants.map((v: any, i: number) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <button 
                    onClick={() => setActiveIndex(i)}
                    style={{
                      width: '60px',
                      height: '60px',
                      padding: 0,
                      border: i === activeIndex ? '2px solid var(--primary-color)' : '1px solid #ddd',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    title={v.color}
                  >
                    <img 
                      src={v.images[0] || '/placeholder.jpg'} 
                      alt={v.color} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </button>
                  <span style={{ fontSize: '0.7rem', color: i === activeIndex ? 'var(--primary-color)' : '#666', fontWeight: i === activeIndex ? 'bold' : 'normal', textTransform: 'uppercase', maxWidth: '60px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {v.color}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Pricing and Cart Logic */}
        <AddToCartLogic product={product} selectedVariant={selectedVariant} fomoThreshold={fomoThreshold} />

        {/* WhatsApp Chat Link */}
        <div style={{ margin: '20px 0', fontSize: '0.9rem', fontWeight: 500 }}>
          Got Questions? <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>Chat with us <span style={{fontSize: '1.1rem'}}>💬</span></a>
        </div>

        {/* Dynamic Accordions */}
        <div className={styles.accordions}>
          
          {product.description && (
            <details className={styles.accordion} open>
              <summary>Description</summary>
              <p style={{ padding: '10px 0', fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>{product.description}</p>
            </details>
          )}

          {/* Automated Product Information */}
          <details className={styles.accordion}>
            <summary>Product Information</summary>
            <div style={{ padding: '10px 0', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '0.9rem' }}>
              <strong style={{color: '#666', fontWeight: 500}}>Colour :</strong> 
              <span style={{textTransform: 'uppercase'}}>{selectedVariant.color}</span>
              
              <strong style={{color: '#666', fontWeight: 500}}>Fabric :</strong> 
              <span style={{textTransform: 'uppercase'}}>{product.mainCategory}</span>
              
              <strong style={{color: '#666', fontWeight: 500}}>Weave :</strong> 
              <span style={{textTransform: 'uppercase'}}>{product.subCategory}</span>
            </div>
          </details>

          {/* Admin Defined Accordions */}
          {product.info && product.info.map((item: any, i: number) => (
            <details key={i} className={styles.accordion}>
              <summary>{item.title}</summary>
              <ul style={{ margin: '10px 0', paddingLeft: '20px', listStyleType: 'disc', color: '#555', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {item.content.split('.').filter((text: string) => text.trim() !== '').map((point: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>{point.trim()}.</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}

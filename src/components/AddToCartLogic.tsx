'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './AddToCartLogic.module.css';
import { useRouter } from 'next/navigation';

export default function AddToCartLogic({ product, selectedVariant }: { product: any, selectedVariant?: any }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();

  const stock = selectedVariant?.stock;
  const isInfiniteStock = stock === undefined; // Backwards compatibility for old products
  const maxQuantity = isInfiniteStock ? 999 : stock;
  const isOutOfStock = maxQuantity === 0;

  useEffect(() => {
    if (quantity > maxQuantity) {
      setQuantity(Math.max(1, maxQuantity));
    }
  }, [maxQuantity, quantity]);

  const totalPrice = product.price * quantity;
  const originalTotalPrice = product.originalPrice ? product.originalPrice * quantity : null;

  const handleAddToCart = (suppressOpen: boolean = false) => {
    addToCart({
      id: `${product.id}-${selectedVariant?.color || 'default'}`,
      productId: product.id,
      name: `${product.name} ${selectedVariant?.color && selectedVariant.color !== 'Default' ? `(${selectedVariant.color})` : ''}`,
      price: product.price,
      size: selectedVariant?.color || 'One Size', 
      quantity: quantity,
      image: selectedVariant?.images?.[0] || product.images?.[0] || '',
      sku: selectedVariant?.sku || product.sku || 'N/A',
      isFreeShipping: product.isFreeShipping !== false
    }, suppressOpen);
  };

  const handleBuyNow = () => {
    handleAddToCart(true); // Suppress cart drawer
    router.push('/checkout');
  };

  return (
    <div className={styles.wrapper}>
      {/* Dedicated Pricing & Quantity Block */}
      <div className={styles.pricingBlock}>
        <div className={styles.priceContainer}>
          {originalTotalPrice && originalTotalPrice > totalPrice && (
            <div className={styles.originalPriceDisplay}>
              <span className={styles.currency}>INR</span>
              <span className={styles.strikeAmount}>{originalTotalPrice.toLocaleString('en-IN')}</span>
              <span className={styles.discountBadge}>SAVE {Math.round(((originalTotalPrice - totalPrice) / originalTotalPrice) * 100)}%</span>
            </div>
          )}
          <div className={styles.priceDisplay}>
            <span className={styles.currency}>INR</span>
            <span className={styles.amount}>{totalPrice.toLocaleString('en-IN')}</span>
          </div>
          <p style={{ marginTop: '15px', fontSize: '1.1rem', fontWeight: 500, fontFamily: 'monospace' }}>
            Sku: {selectedVariant?.sku || product.sku}
          </p>
          {stock !== undefined && stock <= 10 && stock > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#d32f2f', fontWeight: 'bold', fontSize: '0.9rem' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#d32f2f', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
              Only {stock} left in stock - order soon!
            </div>
          )}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(211, 47, 47, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); }
            }
          `}} />
        </div>
        
        <div className={styles.qtyBox} style={{ opacity: isOutOfStock ? 0.5 : 1, pointerEvents: isOutOfStock ? 'none' : 'auto' }}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={styles.qtyBtn} disabled={isOutOfStock}>-</button>
          <span className={styles.qtyNum}>{quantity}</span>
          <button onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} className={styles.qtyBtn} disabled={quantity >= maxQuantity || isOutOfStock}>+</button>
        </div>
      </div>

      <div className={styles.actionRow} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <button 
          className={styles.addBtn} 
          onClick={() => handleAddToCart(false)} 
          disabled={isOutOfStock}
          style={{
            width: '100%', padding: '18px', background: isOutOfStock ? '#f5f5f5' : 'white', 
            border: '1px solid #e2e8f0', color: isOutOfStock ? '#999' : 'var(--primary-color)', 
            textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, 
            cursor: isOutOfStock ? 'not-allowed' : 'pointer', borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
          }}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button 
          className={styles.buyBtn} 
          onClick={handleBuyNow} 
          disabled={isOutOfStock}
          style={{
            width: '100%', padding: '18px', background: isOutOfStock ? '#ddd' : 'var(--primary-color)', 
            border: 'none', color: isOutOfStock ? '#999' : 'white', 
            textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, 
            cursor: isOutOfStock ? 'not-allowed' : 'pointer', borderRadius: '8px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s'
          }}
        >
          {isOutOfStock ? 'Out of Stock' : 'Buy It Now'}
        </button>
      </div>
    </div>
  );
}

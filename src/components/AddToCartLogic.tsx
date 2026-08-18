'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import styles from './AddToCartLogic.module.css';
import { useRouter } from 'next/navigation';

export default function AddToCartLogic({ product, selectedVariant }: { product: any, selectedVariant?: any }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();

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
        </div>
        
        <div className={styles.qtyBox}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className={styles.qtyBtn}>-</button>
          <span className={styles.qtyNum}>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className={styles.qtyBtn}>+</button>
        </div>
      </div>

      <div className={styles.actionRow} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className={styles.addBtn} onClick={() => handleAddToCart(false)} style={{
          width: '100%', padding: '15px', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, cursor: 'pointer'
        }}>
          Add to Cart
        </button>
        <button className={styles.buyBtn} onClick={handleBuyNow} style={{
          width: '100%', padding: '15px', background: 'var(--primary-color)', border: 'none', color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, cursor: 'pointer'
        }}>
          Buy it now
        </button>
        <button className={styles.addBtn} style={{
          width: '100%', padding: '15px', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px'
        }}>
          <span>♡</span> Add to Wishlist
        </button>
        
        {/* Buy on video call */}
        <button style={{
          alignSelf: 'flex-start', padding: '8px 20px', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '25px', marginTop: '10px', cursor: 'pointer'
        }}>
          Buy on video call
        </button>
      </div>
    </div>
  );
}

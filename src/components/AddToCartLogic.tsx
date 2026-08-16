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

  const handleAddToCart = () => {
    addToCart({
      id: `${product.id}-${selectedVariant?.color || 'default'}`,
      productId: product.id,
      name: `${product.name} ${selectedVariant?.color && selectedVariant.color !== 'Default' ? `(${selectedVariant.color})` : ''}`,
      price: product.price,
      size: selectedVariant?.color || 'One Size', 
      quantity: quantity,
      image: selectedVariant?.images?.[0] || product.images?.[0] || '',
      isFreeShipping: product.isFreeShipping !== false
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
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
          <p className={styles.taxNote}>Inclusive of all taxes.</p>
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

      <div className={styles.actionRow}>
        <button className={`btn-secondary ${styles.addBtn}`} onClick={handleAddToCart}>
          Add to Cart
        </button>
        <button className={`btn-primary ${styles.buyBtn}`} onClick={handleBuyNow}>
          Buy it now
        </button>
      </div>
    </div>
  );
}

'use client';

import { useCart } from '@/context/CartContext';
import styles from './CartDrawer.module.css';
import Image from 'next/image';
import Link from 'next/link';

export default function CartDrawer() {
  const { isCartOpen, toggleCart, cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <>
      <div className={`${styles.overlay} ${isCartOpen ? styles.overlayOpen : ''}`} onClick={toggleCart} />
      <div className={`${styles.drawer} ${isCartOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.header}>
          <h2>Shopping Bag</h2>
          <button className={styles.closeBtn} onClick={toggleCart}>CLOSE</button>
        </div>

        <div className={styles.items}>
          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <p className={styles.empty}>Your bag is empty.</p>
              <button 
                onClick={toggleCart} 
                className="btn-primary" 
                style={{ marginTop: '20px', display: 'inline-block', textDecoration: 'none' }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className={styles.item}>
                <div className={styles.imageWrapper}>
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className={styles.image} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#888' }}>No Image</div>
                  )}
                </div>
                <div className={styles.details}>
                  <h4 className={styles.name}>{item.name}</h4>
                  <p className={styles.size}>Size: {item.size}</p>
                  <p className={styles.price}>₹{item.price.toLocaleString('en-IN')}</p>
                  <div className={styles.qtyControls}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>Remove</button>
                  </div>
                </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotal}>
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <p className={styles.taxNote}>Shipping & taxes calculated at checkout.</p>
            <Link href="/checkout" onClick={toggleCart} className={`btn-primary ${styles.checkoutBtn}`}>
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

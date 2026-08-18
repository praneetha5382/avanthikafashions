'use client';

import React from 'react';
import styles from './Marquee.module.css';

export default function Marquee() {
  return (
    <div className={styles.marqueeContainer}>
      <div className={styles.marqueeContent}>
        {/* We duplicate the content to ensure seamless infinite scroll */}
        <span>🌟 Top Quality Guaranteed</span>
        <span className={styles.dot}>•</span>
        <span>🚚 Free Standard Shipping Across India</span>
        <span className={styles.dot}>•</span>
        <span>✨ Premium Authentic Collections</span>
        <span className={styles.dot}>•</span>
        <span>💯 100% Secure Checkout</span>
        <span className={styles.dot}>•</span>
        <span>🌟 Top Quality Guaranteed</span>
        <span className={styles.dot}>•</span>
        <span>🚚 Free Standard Shipping Across India</span>
        <span className={styles.dot}>•</span>
        <span>✨ Premium Authentic Collections</span>
        <span className={styles.dot}>•</span>
        <span>💯 100% Secure Checkout</span>
        <span className={styles.dot}>•</span>
        <span>🌟 Top Quality Guaranteed</span>
        <span className={styles.dot}>•</span>
        <span>🚚 Free Standard Shipping Across India</span>
        <span className={styles.dot}>•</span>
        <span>✨ Premium Authentic Collections</span>
        <span className={styles.dot}>•</span>
        <span>💯 100% Secure Checkout</span>
        <span className={styles.dot}>•</span>
      </div>
    </div>
  );
}

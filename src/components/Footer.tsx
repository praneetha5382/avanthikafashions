import styles from './Footer.module.css';
import Link from 'next/link';
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerContainer}`}>
        
        <div className={styles.section}>
          <h3 className={styles.brandTitle}>Avanthika Fashions</h3>
          <p className={styles.brandDesc}>
            Avanthika Fashions brings you the pinnacle of authentic Indian craftsmanship. 
            We specialize in pure silk Banarasi sarees, meticulously handwoven by master artisans 
            to preserve our rich weaving heritage.
          </p>
        </div>

        <div className={styles.section}>
          <h3>Shop</h3>
          <ul>
            <li><Link href="/collections/all">All Sarees</Link></li>
            <li><Link href="/collections/banarasi">Banarasi Silk</Link></li>
            <li><Link href="/collections/bridal">Bridal Collection</Link></li>
            <li><Link href="/about">About Us</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Customer Care</h3>
          <ul>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Track Order</a></li>
            <li><Link href="/policies/refund-policy">Returns & Refunds</Link></li>
            <li><Link href="/policies/terms-of-service">Terms of Service</Link></li>
            <li><Link href="/policies/privacy-policy">Privacy Policy</Link></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Exclusive Access</h3>
          <p className={styles.newsletterText}>Join our newsletter for early access to new collections and exclusive offers.</p>
          <div className={styles.subscribe}>
            <input type="email" placeholder="Email Address" className={styles.input} />
            <button className={styles.subscribeBtn}>Join</button>
          </div>
        </div>

      </div>
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomContent}`}>
          <p>&copy; {new Date().getFullYear()} Avanthika Fashions. All rights reserved.</p>
          <div className={styles.paymentIcons}>
            <span>Secure Payments via Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

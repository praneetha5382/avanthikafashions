import styles from './Footer.module.css';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Top Newsletter Section */}
      <div className={styles.newsletterSection}>
        <div className="container">
          <h2 className={styles.newsletterTitle}>STAY IN THE LOOP</h2>
          <p className={styles.newsletterSub}>Subscribe for new arrivals & exclusive offers.</p>
          <div className={styles.subscribeRow}>
            <input type="email" placeholder="Email" className={styles.subscribeInput} />
            <button aria-label="Subscribe" className={styles.subscribeArrow}>→</button>
          </div>
        </div>
      </div>

      {/* Accordion Links Section */}
      <div className={styles.linksSection}>
        <div className="container">
          <details className={styles.footerAccordion}>
            <summary>SHOP</summary>
            <ul>
              <li><Link href="/collections/all">All Collections</Link></li>
              <li><Link href="/collections/banarasi">Banarasi Silk</Link></li>
            </ul>
          </details>

          <details className={styles.footerAccordion}>
            <summary>CUSTOMER CARE</summary>
            <ul>
              <li><Link href="/account">My Account</Link></li>
              <li><a href="#">Track Order</a></li>
            </ul>
          </details>

          <details className={styles.footerAccordion}>
            <summary>ABOUT US</summary>
            <ul>
              <li><Link href="/about">Our Story</Link></li>
              <li><a href="#">Artisans</a></li>
            </ul>
          </details>

          <details className={styles.footerAccordion}>
            <summary>LEGAL</summary>
            <ul>
              <li><Link href="/policies/terms-of-service">Terms of Service</Link></li>
              <li><Link href="/policies/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/policies/refund-policy">Refund Policy</Link></li>
            </ul>
          </details>

          <details className={styles.footerAccordion}>
            <summary>NEED HELP</summary>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Contact Support</a></li>
            </ul>
          </details>

          {/* Contact Icons */}
          <div className={styles.contactList}>
            <a href="mailto:hello@avanthika.com"><span className={styles.icon}>✉️</span> Email Us</a>
            <a href="https://wa.me/919876543210"><span className={styles.icon}>💬</span> Whatsapp Us</a>
          </div>

          <div className={styles.bottomRow}>
            <p className={styles.copyright}>&copy; {new Date().getFullYear()}, Avanthika Fashions. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

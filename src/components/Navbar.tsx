'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import styles from './Navbar.module.css';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SearchOverlay from './SearchOverlay';
import LoginModal from './LoginModal';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { toggleCart, cartCount } = useCart();
  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(data => {
      if (data.categories) {
        setCategories(data.categories.filter((c: any) => c.isVisible !== false));
      }
    });
  }, []);

  return (
    <>
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={() => router.push('/account')}
      />
      <header className={`${styles.header} ${isHome ? styles.headerTransparent : ''}`}>
      <div className={`container ${styles.navContainer}`}>
        
        {/* Left: Mobile Hamburger & WhatsApp */}
        <div className={styles.leftActions}>
          <button className={styles.hamburger} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
          <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className={styles.iconBtn} aria-label="WhatsApp" style={{ color: '#25D366' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </a>
        </div>

        {/* Center: Logo */}
        <div className={styles.logo}>
          <Link href="/">
            <NextImage src="/logo.png" alt="Avanthika Fashions" width={120} height={40} style={{ objectFit: 'contain' }} priority unoptimized />
          </Link>
        </div>

        {/* Right: Search, Wishlist, Cart */}
        <div className={styles.actions}>
          <button aria-label="Search" className={styles.iconBtn} onClick={() => setIsSearchOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          
          <button aria-label="Wishlist" className={styles.iconBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>

          <button aria-label="Cart" className={styles.iconBtn} onClick={toggleCart} style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
        </div>
        
        {/* Mobile Navigation Drawer */}
        <nav className={`${styles.navLinks} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
          <button className={styles.closeMenu} onClick={() => setMobileMenuOpen(false)}>✕</button>
          
          <Link href="/" className={styles.link} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/collections/all" className={styles.link} onClick={() => setMobileMenuOpen(false)}>Shop All</Link>
          
          {categories.map((c: any) => (
            <Link key={c.id} href={`/collections/${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className={styles.link} onClick={() => setMobileMenuOpen(false)}>
              {c.name}
            </Link>
          ))}
          
          {isLoggedIn ? (
            <Link href="/account" className={styles.link} onClick={() => setMobileMenuOpen(false)}>My Account</Link>
          ) : (
            <button className={styles.link} onClick={() => { setMobileMenuOpen(false); setIsLoginModalOpen(true); }} style={{background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0}}>
              Login / Register
            </button>
          )}
        </nav>

      </div>
    </header>
    </>
  );
}

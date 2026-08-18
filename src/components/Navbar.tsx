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
    }).catch(err => console.error("Error fetching categories:", err));
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </a>
        </div>

        {/* Center: Logo */}
        <div className={styles.logo}>
          <Link href="/">
            <NextImage src="/logo.png" alt="Avanthika Fashions" width={180} height={80} style={{ objectFit: 'contain' }} priority unoptimized />
          </Link>
        </div>

        {/* Right: Search, Wishlist, Cart */}
        <div className={styles.actions}>
          <button aria-label="Search" className={styles.iconBtn} onClick={() => setIsSearchOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
          
          <div className={styles.dropdownContainer}>
            <button className={styles.dropdownToggle} onClick={() => setActiveDropdown(activeDropdown === 'shop' ? null : 'shop')}>
              Shop by Collection {activeDropdown === 'shop' ? '▲' : '▼'}
            </button>
            {activeDropdown === 'shop' && (
              <div className={styles.dropdownMenu}>
                {(categories.length > 0 ? categories : [
                  { id: '1', name: 'Sarees' },
                  { id: '2', name: 'Lehengas' },
                  { id: '3', name: 'Kurti Sets' },
                  { id: '4', name: 'Indo Western' }
                ]).map((c: any) => (
                  <Link key={c.id} href={`/collections/${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className={styles.dropdownItem} onClick={() => setMobileMenuOpen(false)}>
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
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

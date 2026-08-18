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
        
        {/* Mobile Hamburger Icon */}
        <button className={styles.hamburger} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          ☰
        </button>

        <nav className={`${styles.navLinks} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
          <button className={styles.closeMenu} onClick={() => setMobileMenuOpen(false)}>✕</button>
          
          <Link href="/" className={styles.link} onClick={() => setMobileMenuOpen(false)}>Home</Link>
          
          <Link href="/collections/all" className={styles.link} onClick={() => setMobileMenuOpen(false)}>Shop All</Link>
          
          {/* Single Clean Collections Dropdown */}
          <div 
            className={styles.dropdownContainer}
            onMouseEnter={() => setActiveDropdown('collections')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button 
              className={styles.link} 
              style={{background:'transparent', border:'none'}}
              onClick={() => setActiveDropdown(activeDropdown === 'collections' ? null : 'collections')}
            >
              COLLECTIONS <span className={`${styles.chevron} ${activeDropdown === 'collections' ? styles.chevronUp : ''}`}>▾</span>
            </button>
            <div className={`${styles.dropdownMenu} ${activeDropdown === 'collections' ? styles.showDropdown : ''}`}>
              {categories.map((c: any) => (
                <div key={c.id} className={styles.dropdownGroup}>
                  <Link href={`/collections/${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className={styles.dropdownTitle} onClick={() => setMobileMenuOpen(false)}>
                    {c.name}
                  </Link>
                  <div className={styles.dropdownSubItems}>
                    {c.subcategories?.map((sub: string, idx: number) => (
                      <Link 
                        key={idx} 
                        href={`/collections/${sub.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} 
                        className={styles.dropdownItem}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className={styles.logo}>
          <Link href="/">
            <NextImage src="/logo.png" alt="Avanthika Fashions" width={220} height={100} style={{ objectFit: 'contain' }} priority unoptimized />
          </Link>
        </div>

        <div className={styles.actions}>
          <button aria-label="Search" className={styles.iconBtn} onClick={() => setIsSearchOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
          
          {isLoggedIn ? (
            <Link href="/account" className={styles.iconBtn} aria-label="Profile">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </Link>
          ) : (
            <button aria-label="Login" className={styles.iconBtn} onClick={() => setIsLoginModalOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </button>
          )}

          <button aria-label="Cart" className={styles.iconBtn} onClick={toggleCart} style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
    </>
  );
}

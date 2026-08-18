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
          <button aria-label="Search" className={styles.iconBtn} onClick={() => setIsSearchOpen(true)}>Search</button>
          
          {isLoggedIn ? (
            <Link href="/account" className={styles.iconBtn} style={{textDecoration: 'none'}}>Profile</Link>
          ) : (
            <button aria-label="Login" className={styles.iconBtn} onClick={() => setIsLoginModalOpen(true)}>Login</button>
          )}

          <button aria-label="Cart" className={styles.iconBtn} onClick={toggleCart}>
            Cart ({cartCount})
          </button>
        </div>
      </div>
    </header>
    </>
  );
}

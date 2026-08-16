'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import styles from './Navbar.module.css';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SearchOverlay from './SearchOverlay';

export default function Navbar() {
  const { toggleCart, cartCount } = useCart();
  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
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
            <button className={styles.link} style={{background:'transparent', border:'none'}}>
              COLLECTIONS <span className={styles.chevron}>▾</span>
            </button>
            <div className={`${styles.dropdownMenu} ${activeDropdown === 'collections' ? styles.showDropdown : ''}`} style={{ width: '600px', padding: '20px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              {categories.map((c: any) => (
                <div key={c.id} style={{ minWidth: '150px' }}>
                  <Link href={`/collections/${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} style={{ fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '10px', display: 'block' }} onClick={() => setMobileMenuOpen(false)}>
                    {c.name}
                  </Link>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
          <button aria-label="Cart" className={styles.iconBtn} onClick={toggleCart}>
            Cart ({cartCount})
          </button>
        </div>
      </div>
    </header>
    </>
  );
}

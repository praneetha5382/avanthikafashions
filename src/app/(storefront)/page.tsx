'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const [data, setData] = useState<any>({ categories: [], products: [], siteSettings: { showHero: true, showQuickLinks: true, showTrending: true, showTopPicks: true } });

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(res => {
      setData({
        categories: res.categories || [],
        products: (res.products || []).filter((p: any) => p.isVisible !== false),
        siteSettings: res.siteSettings || { showHero: true, showQuickLinks: true, showTrending: true, showTopPicks: true }
      });
    });
  }, []);

  const topPicks = data.products.filter((p: any) => p.isNewArrival || p.discount).slice(0, 4);

  // Helper to find an image for a category
  const getCategoryImage = (mainCat: string) => {
    const product = data.products.find((p: any) => p.mainCategory === mainCat);
    return product?.variants?.[0]?.images?.[0] || product?.images?.[0] || '/saree-hero.jpg';
  };
  
  const getFallbackImage = (index: number) => {
    const p = data.products[index % data.products.length];
    return p?.variants?.[0]?.images?.[0] || p?.images?.[0] || '/saree-hero.jpg';
  };

  return (
    <div className={styles.page}>
      
      {/* Seamless Hero Section */}
      {data.siteSettings?.showHero && (
        <section className={styles.hero}>
          <div className={styles.heroImageWrapper}>
            {/* The image now acts as a full-bleed background */}
            <Image src="/saree-hero.jpg" alt="The Occasion Edit" fill className={styles.heroImage} priority unoptimized />
            <div className={styles.heroOverlay}></div>
          </div>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>THE OCCASION EDIT</h1>
            <p className={styles.heroSubtitle}>Elegant silhouettes with timeless charm.</p>
          </div>
        </section>
      )}

      {/* Quick Links Row */}
      {data.siteSettings?.showQuickLinks && (
        <section className={`container ${styles.section}`}>
          <div className={styles.bannerGrid} style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
            {data.siteSettings?.promo1 !== false && (
              <Link href="/collections/under-999" className={styles.bannerCard} style={{ flex: '1 1 300px', maxWidth: '600px' }}>
                <Image src={getFallbackImage(0)} alt="Under 999" fill style={{ objectFit: 'cover' }} unoptimized className={styles.bannerCardImg} />
                <div className={styles.bannerOverlay}>
                  <span className={styles.bannerText}>Under 999</span>
                </div>
              </Link>
            )}
            {data.siteSettings?.promo2 !== false && (
              <Link href="/collections/under-1499" className={styles.bannerCard} style={{ flex: '1 1 300px', maxWidth: '600px' }}>
                <Image src={getFallbackImage(1)} alt="Under 1499" fill style={{ objectFit: 'cover' }} unoptimized className={styles.bannerCardImg} />
                <div className={styles.bannerOverlay}>
                  <span className={styles.bannerText}>Under 1499</span>
                </div>
              </Link>
            )}
            {data.siteSettings?.promo3 !== false && (
              <Link href="/collections/office-wear" className={styles.bannerCard} style={{ flex: '1 1 300px', maxWidth: '600px' }}>
                <Image src={getFallbackImage(2)} alt="Office Wear" fill style={{ objectFit: 'cover' }} unoptimized className={styles.bannerCardImg} />
                <div className={styles.bannerOverlay}>
                  <span className={styles.bannerText}>Office Wear</span>
                </div>
              </Link>
            )}
            {data.siteSettings?.promo4 !== false && (
              <Link href="/collections/wedding" className={styles.bannerCard} style={{ flex: '1 1 300px', maxWidth: '600px' }}>
                <Image src={getFallbackImage(3)} alt="Wedding" fill style={{ objectFit: 'cover' }} unoptimized className={styles.bannerCardImg} />
                <div className={styles.bannerOverlay}>
                  <span className={styles.bannerText}>Wedding Collection</span>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Trending Collection (Portrait Cards) */}
      {data.siteSettings?.showTrending && data.categories.length > 0 && (
        <section className={styles.trendingSection}>
          <h2 className={styles.sectionTitle}>Shop by Category</h2>
          <div className={styles.categoryGrid}>
            {data.categories.filter((cat: any) => cat.isVisible !== false).map((cat: any) => (
              <Link href={`/collections/${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} key={cat.id} className={styles.categoryCard}>
                <Image src={getCategoryImage(cat.name)} alt={cat.name} fill style={{ objectFit: 'cover' }} unoptimized className={styles.categoryCardImg} />
                <div className={styles.categoryOverlay}>
                  <span className={styles.categoryText}>{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top Picks / New Arrivals Slider */}
      {data.siteSettings?.showTopPicks && topPicks.length > 0 && (
        <section className={`container ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Top Picks</h2>
          <div className={styles.topPicksGrid}>
            {topPicks.map((p: any) => (
              <Link href={`/products/${p.slug}`} key={p.id} className={styles.productCard}>
                <div className={styles.cardImgWrapper}>
                  {p.discount && <span className={styles.badge}>{p.discount} OFF</span>}
                  <img src={p.variants?.[0]?.images?.[0] || p.images?.[0] || '/saree-hero.jpg'} alt={p.name} className={styles.primaryImg} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  {(p.variants?.[0]?.images?.[1] || p.images?.[1]) && (
                    <img src={p.variants?.[0]?.images?.[1] || p.images?.[1]} alt={p.name} className={styles.secondaryImg} style={{ width: '100%', height: 'auto', display: 'block' }} />
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardTitle}>{p.name}</h3>
                  <div className={styles.cardPricing}>
                    {p.originalPrice !== p.price && <span className={styles.strike}>Rs. {p.originalPrice}</span>}
                    <span className={styles.price}>Rs. {p.price}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

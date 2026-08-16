'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import FilterSidebar from '@/components/FilterSidebar';
import Link from 'next/link';
import Image from 'next/image';

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string; // 'all', 'banarasi', 'royal-edit', etc.
  
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState('All Collections');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(data => {
      let prods = data.products;
      
      // Filter by category slug if it's not 'all'
      if (slug !== 'all') {
        const matchingProducts = prods.filter((p: any) => {
          const mainSlug = p.mainCategory?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const subSlug = p.subCategory?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return mainSlug === slug || subSlug === slug;
        });

        if (matchingProducts.length > 0) {
          prods = matchingProducts;
          setCategoryName(slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
        } else {
          // If slug matches a hardcoded type (from homepage quick links)
          if (slug === 'under-999') {
            setCategoryName('Under 999');
            prods = prods.filter((p: any) => p.price <= 999);
          } else if (slug === 'office-wear') {
            setCategoryName('Office Wear');
            prods = prods.filter((p: any) => p.mainCategory === 'Cotton');
          } else if (slug === 'wedding') {
            setCategoryName('Wedding Collection');
            prods = prods.filter((p: any) => p.mainCategory === 'Banarasi' || p.price > 5000);
          } else {
            setCategoryName(slug.replace(/-/g, ' ').toUpperCase());
            prods = [];
          }
        }
      }

      setAllProducts(prods);
      setFilteredProducts(prods);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className={styles.loading}>Loading Collections...</div>;

  return (
    <div className={styles.collectionPage}>
      <header className={styles.header}>
        <h1 className={styles.title}>{categoryName}</h1>
        <p className={styles.subtitle}>Showing {filteredProducts.length} items</p>
      </header>

      <div className={`container ${styles.layout}`}>
        <FilterSidebar products={allProducts} onFilterChange={setFilteredProducts} />

        <main className={styles.grid}>
          {filteredProducts.map(p => (
            <Link href={`/products/${p.slug}`} key={p.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                {p.discount && <span className={styles.discountBadge}>{p.discount}</span>}
                <Image 
                  src={p.variants?.[0]?.images?.[0] || p.images?.[0] || '/placeholder.jpg'} 
                  alt={p.name} 
                  fill 
                  className={styles.primaryImg}
                  unoptimized
                />
                {(p.variants?.[0]?.images?.[1] || p.images?.[1]) && (
                  <Image 
                    src={p.variants?.[0]?.images?.[1] || p.images?.[1]} 
                    alt={p.name} 
                    fill 
                    className={styles.secondaryImg}
                    unoptimized
                  />
                )}
              </div>
              <div className={styles.cardInfo}>
                <h3 className={styles.productName}>{p.name}</h3>
                <div className={styles.priceRow}>
                  {p.originalPrice !== p.price ? (
                    <>
                      <span className={styles.strikePrice}>Rs. {p.originalPrice.toLocaleString('en-IN')}</span>
                      <span className={styles.price}>Rs. {p.price.toLocaleString('en-IN')}</span>
                    </>
                  ) : (
                    <span className={styles.price}>Rs. {p.price.toLocaleString('en-IN')}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </main>
      </div>
    </div>
  );
}

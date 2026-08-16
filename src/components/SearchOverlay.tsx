'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import styles from './SearchOverlay.module.css';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  images: string[];
}

export default function SearchOverlay({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch all products once when opened for blazing fast client-side filtering
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (data.products) setAllProducts(data.products);
        });
      
      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }

    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(q)
    );
    setResults(filtered);
  }, [query, allProducts]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <input 
          ref={inputRef}
          type="text" 
          className={styles.searchInput} 
          placeholder="Search for Sarees, Fabrics, Colors..." 
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div className={styles.resultsContainer}>
        {query && results.length === 0 && (
          <p className={styles.noResults}>No products found for "{query}".</p>
        )}

        <div className={styles.grid}>
          {results.map(product => (
            <Link href={`/products/${product.slug}`} key={product.id} className={styles.productCard} onClick={onClose}>
               <div className={styles.imageWrapper}>
                 {product.images && product.images.length > 0 ? (
                   <NextImage src={product.images[0]} alt={product.name} fill className={styles.productImage} unoptimized />
                 ) : (
                   <div className={styles.placeholderImage}>No Image</div>
                 )}
               </div>
               <div className={styles.info}>
                 <h4 className={styles.name}>{product.name}</h4>
                 <p className={styles.price}>Rs. {product.price}</p>
               </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

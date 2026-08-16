'use client';

import { useState, useEffect } from 'react';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
  products: any[];
  onFilterChange: (filtered: any[]) => void;
}

export default function FilterSidebar({ products, onFilterChange }: FilterSidebarProps) {
  // Extract unique filter options from products
  const maxPriceAvail = Math.max(...products.map(p => p.price), 20000);
  const colors = Array.from(new Set(products.flatMap(p => p.variants?.map((v:any) => v.color) || p.colors || [])));
  const mainCategories = Array.from(new Set(products.map(p => p.mainCategory).filter(Boolean)));

  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPriceAvail]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMainCats, setSelectedMainCats] = useState<string[]>([]);
  const [selectedSubCats, setSelectedSubCats] = useState<string[]>([]);

  // Dynamically calculate available subcategories based on selected main categories
  const availableSubCategories = selectedMainCats.length === 0 
    ? Array.from(new Set(products.map(p => p.subCategory).filter(Boolean)))
    : Array.from(new Set(products.filter(p => selectedMainCats.includes(p.mainCategory)).map(p => p.subCategory).filter(Boolean)));

  useEffect(() => {
    let filtered = products;

    // Price Filter
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Color Filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => {
        const pColors = p.variants?.map((v:any) => v.color) || p.colors || [];
        return pColors.some((c: string) => selectedColors.includes(c));
      });
    }

    // Main Category Filter
    if (selectedMainCats.length > 0) {
      filtered = filtered.filter(p => selectedMainCats.includes(p.mainCategory));
    }

    // Sub Category Filter
    if (selectedSubCats.length > 0) {
      filtered = filtered.filter(p => selectedSubCats.includes(p.subCategory));
    }

    onFilterChange(filtered);
  }, [priceRange, selectedColors, selectedMainCats, selectedSubCats, products]);

  const toggleArrayItem = (array: string[], setArray: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.filterTitle}>Filters</h2>
      
      <div className={styles.filterSection}>
        <h3>Price Range</h3>
        <div className={styles.priceSlider}>
          <input 
            type="range" 
            min="0" 
            max={maxPriceAvail} 
            step="500"
            value={priceRange[1]} 
            onChange={e => setPriceRange([0, Number(e.target.value)])} 
            className={styles.rangeInput}
          />
          <div className={styles.priceLabels}>
            <span>Rs. 0</span>
            <span>Rs. {priceRange[1]}</span>
          </div>
        </div>
      </div>

      {colors.length > 0 && (
        <div className={styles.filterSection}>
          <h3>Colour</h3>
          <div className={styles.optionsList}>
            {colors.map(c => (
              <label key={c} className={styles.optionLabel}>
                <input 
                  type="checkbox" 
                  checked={selectedColors.includes(c)}
                  onChange={() => toggleArrayItem(selectedColors, setSelectedColors, c)} 
                />
                <span className={styles.customCheck}></span>
                {c}
              </label>
            ))}
          </div>
        </div>
      )}

      {mainCategories.length > 0 && (
        <div className={styles.filterSection}>
          <h3>Fabric</h3>
          <div className={styles.optionsList}>
            {mainCategories.map(cat => (
              <label key={cat} className={styles.optionLabel}>
                <input 
                  type="checkbox" 
                  checked={selectedMainCats.includes(cat)}
                  onChange={() => toggleArrayItem(selectedMainCats, setSelectedMainCats, cat)} 
                />
                <span className={styles.customCheck}></span>
                {cat}
              </label>
            ))}
          </div>
        </div>
      )}

      {availableSubCategories.length > 0 && (
        <div className={styles.filterSection}>
          <h3>Weave</h3>
          <div className={styles.optionsList}>
            {availableSubCategories.map((sub: unknown) => {
              const subStr = sub as string;
              return (
              <label key={subStr} className={styles.optionLabel}>
                <input 
                  type="checkbox" 
                  checked={selectedSubCats.includes(subStr)}
                  onChange={() => toggleArrayItem(selectedSubCats, setSelectedSubCats, subStr)} 
                />
                <span className={styles.customCheck}></span>
                {subStr}
              </label>
            )
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

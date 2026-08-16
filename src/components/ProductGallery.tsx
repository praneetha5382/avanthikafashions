'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import styles from './ProductGallery.module.css';

export default function ProductGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Fallback if no images
  if (!images || images.length === 0) {
    return (
      <div className={styles.galleryContainer}>
        <div className={styles.mainImageWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' }}>
          <p style={{ color: '#888', fontFamily: 'sans-serif' }}>No Image Available</p>
        </div>
      </div>
    );
  }

  // Duplicate the image array locally if there's only 1 image, just to demonstrate the slider UI for the user.
  // In a real scenario, you'd only show thumbnails if images.length > 1.
  const displayImages = images.length === 1 ? [images[0], images[0], images[0]] : images;

  const currentImage = displayImages[activeIndex];

  return (
    <>
      <div className={styles.galleryContainer}>
        {/* Thumbnails Slider (Left Side Desktop) */}
        {displayImages.length > 1 && (
          <div className={styles.thumbnails}>
            {displayImages.map((src, idx) => (
              <div 
                key={idx} 
                className={`${styles.thumbnailWrapper} ${idx === activeIndex ? styles.active : ''}`}
                onClick={() => setActiveIndex(idx)}
              >
                <NextImage 
                  src={src} 
                  alt={`Thumbnail ${idx + 1}`} 
                  fill 
                  className={styles.thumbnailImage} 
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* Main Image */}
        <div className={styles.mainImageWrapper} onClick={() => setIsLightboxOpen(true)}>
          <NextImage 
            src={currentImage} 
            alt="Product View" 
            fill 
            className={styles.mainImage} 
            priority 
            unoptimized 
          />
        </div>
      </div>

      {/* Fullscreen Lightbox Overlay */}
      {isLightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <button className={styles.closeButton} onClick={() => setIsLightboxOpen(false)}>×</button>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
             <NextImage 
              src={currentImage} 
              alt="Fullscreen Product View" 
              fill 
              className={styles.lightboxImage} 
              unoptimized 
            />
          </div>
        </div>
      )}
    </>
  );
}

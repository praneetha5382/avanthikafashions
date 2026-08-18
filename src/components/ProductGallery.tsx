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

        {/* Main Image (Desktop) & Swipeable Carousel (Mobile) */}
        <div 
          className={styles.carousel}
          onScroll={(e) => {
            const target = e.currentTarget;
            const scrollPosition = target.scrollLeft;
            const slideWidth = target.clientWidth;
            const newIndex = Math.round(scrollPosition / slideWidth);
            if (newIndex !== activeIndex) setActiveIndex(newIndex);
          }}
        >
          <div 
            className={styles.carouselTrack}
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {displayImages.map((src, idx) => (
              <div 
                key={idx} 
                className={styles.carouselSlide}
                onClick={() => setIsLightboxOpen(true)}
              >
                <NextImage 
                  src={src} 
                  alt="Product View" 
                  fill 
                  className={styles.mainImage} 
                  priority={idx === 0}
                  unoptimized 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile Pagination Dots */}
      {displayImages.length > 1 && (
        <div className={styles.carouselDots}>
          {displayImages.map((_, idx) => (
            <div 
              key={idx} 
              className={`${styles.dot} ${idx === activeIndex ? styles.active : ''}`}
            />
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Overlay */}
      {isLightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <button className={styles.closeButton} onClick={() => setIsLightboxOpen(false)}>×</button>
          <div 
            className={`${styles.lightboxContent} ${styles.lightboxScroll}`} 
            onClick={(e) => e.stopPropagation()}
            onScroll={(e) => {
              const target = e.currentTarget;
              const scrollPosition = target.scrollLeft;
              const slideWidth = target.clientWidth;
              const newIndex = Math.round(scrollPosition / slideWidth);
              if (newIndex !== activeIndex) setActiveIndex(newIndex);
            }}
          >
            {displayImages.map((src, idx) => (
               <div key={idx} className={styles.lightboxSlide}>
                 <NextImage 
                  src={src} 
                  alt="Fullscreen Product View" 
                  fill 
                  className={styles.lightboxImage} 
                  unoptimized 
                />
               </div>
            ))}
          </div>
          
          {/* Lightbox Dots */}
          {displayImages.length > 1 && (
            <div className={styles.lightboxDots}>
              {displayImages.map((_, idx) => (
                <div key={idx} className={`${styles.dot} ${idx === activeIndex ? styles.active : ''}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

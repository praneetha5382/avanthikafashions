import Image from 'next/image';
import styles from './page.module.css';
import ProductDetailsClient from '@/components/ProductDetailsClient';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbPath = path.join(process.cwd(), 'src/lib/db.json');
  const products = JSON.parse(fs.readFileSync(dbPath, 'utf-8')).products;
  const product = products.find((p: any) => p.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <div className={styles.productPage}>
      <div className={styles.container}>
        <nav className={styles.breadcrumbs}>
          <a href="/">Home</a> / 
          {product.mainCategory && (
            <> <a href={`/collections/${product.mainCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{product.mainCategory}</a> / </>
          )}
          {product.subCategory && (
            <> <a href={`/collections/${product.subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{product.subCategory}</a> / </>
          )}
          <span>{product.name}</span>
        </nav>
        <ProductDetailsClient product={product} />
      </div>
    </div>
  );
}

import styles from './policies.module.css';

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.policyContainer}>
      <div className={styles.policyContent}>
        {children}
      </div>
    </div>
  );
}

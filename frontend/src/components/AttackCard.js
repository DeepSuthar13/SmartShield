import styles from "./StatCard.module.css";

export default function AttackCard({ count }) {
  return (
    <div className={styles.card}>
      <div className={`${styles.iconWrap} ${styles.red}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div className={styles.info}>
        <span className={styles.label}>Attacks Detected</span>
        <span className={styles.value}>{Number(count).toLocaleString()}</span>
      </div>
    </div>
  );
}

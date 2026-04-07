import styles from "./StatCard.module.css";

export default function TrafficCard({ count }) {
  return (
    <div className={styles.card}>
      <div className={`${styles.iconWrap} ${styles.blue}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <div className={styles.info}>
        <span className={styles.label}>Total Traffic</span>
        <span className={styles.value}>{Number(count).toLocaleString()}</span>
      </div>
    </div>
  );
}

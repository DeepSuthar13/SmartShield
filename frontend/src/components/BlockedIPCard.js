import styles from "./StatCard.module.css";

export default function BlockedIPCard({ count }) {
  return (
    <div className={styles.card}>
      <div className={`${styles.iconWrap} ${styles.orange}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <div className={styles.info}>
        <span className={styles.label}>Blocked IPs</span>
        <span className={styles.value}>{Number(count).toLocaleString()}</span>
      </div>
    </div>
  );
}

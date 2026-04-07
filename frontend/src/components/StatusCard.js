import styles from "./StatusCard.module.css";

export default function StatusCard({ status }) {
  const isUnderAttack = status === "under_attack";

  return (
    <div className={`${styles.card} ${isUnderAttack ? styles.danger : styles.safe}`}>
      <div className={styles.iconWrap}>
        {isUnderAttack ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.label}>System Status</span>
        <span className={styles.value}>
          <span className={`${styles.dot} ${isUnderAttack ? styles.dotDanger : styles.dotSafe}`} />
          {isUnderAttack ? "Under Attack" : "Normal"}
        </span>
      </div>
    </div>
  );
}

import styles from "./AlertsPanel.module.css";

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function AlertsPanel({ alerts }) {
  const list = alerts || [];

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        Recent Alerts
        {list.length > 0 && (
          <span className={styles.count}>{list.length}</span>
        )}
      </h3>

      <div className={styles.scrollArea}>
        {list.length === 0 ? (
          <div className={styles.empty}>No alerts</div>
        ) : (
          list.map((alert, i) => (
            <div key={alert.ID || i} className={styles.alertItem}>
              <div className={styles.alertDot} />
              <div className={styles.alertContent}>
                <p className={styles.alertMsg}>{alert.MESSAGE}</p>
                <span className={styles.alertTime}>
                  {formatDate(alert.CREATED_AT)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import styles from "./BlockedIPList.module.css";

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function actionBadge(action) {
  const map = {
    block: { label: "Blocked", cls: "badgeRed" },
    rate_limit: { label: "Rate Limit", cls: "badgeOrange" },
    captcha: { label: "CAPTCHA", cls: "badgePurple" },
  };
  return map[action] || { label: action, cls: "badgeRed" };
}

export default function BlockedIPList({ ips }) {
  const list = ips || [];

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Blocked IPs
      </h3>

      {list.length === 0 ? (
        <div className={styles.empty}>No blocked IPs</div>
      ) : (
        <div className={styles.list}>
          {list.map((item, i) => {
            const badge = actionBadge(item.ACTION);
            return (
              <div key={item.ID || i} className={styles.row}>
                <div className={styles.ip}>
                  <code>{item.IP_ADDRESS}</code>
                </div>
                <span className={`${styles.badge} ${styles[badge.cls]}`}>
                  {badge.label}
                </span>
                <span className={styles.time}>{formatDate(item.CREATED_AT)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

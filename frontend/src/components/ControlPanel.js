"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import styles from "./ControlPanel.module.css";

const MODES = [
  {
    id: "block",
    label: "Block IP",
    desc: "Drop traffic via iptables",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    ),
    color: "#ef4444",
    bg: "#fef2f2",
  },
  {
    id: "rate_limit",
    label: "Rate Limit",
    desc: "Throttle via Nginx",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    color: "#f59e0b",
    bg: "#fef9e7",
  },
  {
    id: "captcha",
    label: "CAPTCHA",
    desc: "Challenge suspicious IPs",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M12 8v4"/>
        <path d="M12 16h.01"/>
      </svg>
    ),
    color: "#8b5cf6",
    bg: "#f0ecfe",
  },
];

export default function ControlPanel() {
  const [active, setActive] = useState("block");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleSetMode(mode) {
    if (loading) return;
    setLoading(true);
    setFeedback("");

    try {
      await api.setDefence(mode);
      setActive(mode);
      setFeedback(`Mode switched to: ${mode.replace("_", " ")}`);
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        Defence Control
      </h3>

      <div className={styles.modes}>
        {MODES.map((mode) => (
          <button
            key={mode.id}
            id={`defence-${mode.id}`}
            className={`${styles.modeBtn} ${active === mode.id ? styles.active : ""}`}
            style={{
              "--mode-color": mode.color,
              "--mode-bg": mode.bg,
            }}
            onClick={() => handleSetMode(mode.id)}
            disabled={loading}
          >
            <div className={styles.modeIcon}>{mode.icon}</div>
            <div className={styles.modeInfo}>
              <span className={styles.modeLabel}>{mode.label}</span>
              <span className={styles.modeDesc}>{mode.desc}</span>
            </div>
            {active === mode.id && (
              <span className={styles.activeBadge}>Active</span>
            )}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={styles.feedback}>{feedback}</div>
      )}
    </div>
  );
}

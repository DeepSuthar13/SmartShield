"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StatusCard from "@/components/StatusCard";
import TrafficCard from "@/components/TrafficCard";
import AttackCard from "@/components/AttackCard";
import BlockedIPCard from "@/components/BlockedIPCard";
import LiveGraph from "@/components/LiveGraph";
import BlockedIPList from "@/components/BlockedIPList";
import AlertsPanel from "@/components/AlertsPanel";
import ControlPanel from "@/components/ControlPanel";
import styles from "./dashboard.module.css";

const POLL_INTERVAL = 3000; // 3 seconds

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ status: "normal", totalRequests: 0, attackCount: 0, blockedCount: 0 });
  const [alerts, setAlerts] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("smartshield_token");
    const userData = localStorage.getItem("smartshield_user");

    if (!token || !userData) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, alertsRes, blockedRes, trafficRes] = await Promise.allSettled([
        api.getStats(),
        api.getAlerts(),
        api.getBlockedIPs(),
        api.getTraffic(),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (alertsRes.status === "fulfilled") setAlerts(alertsRes.value.alerts || []);
      if (blockedRes.status === "fulfilled") setBlockedIPs(blockedRes.value.blockedIPs || []);
      if (trafficRes.status === "fulfilled") setTraffic(trafficRes.value.traffic || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling
  useEffect(() => {
    if (!user) return;

    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user, fetchData]);

  // Logout
  function handleLogout() {
    localStorage.removeItem("smartshield_token");
    localStorage.removeItem("smartshield_user");
    window.location.href = "/login";
  }

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div className={styles.page}>
      {/* ─── Nav ─────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <div className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span>SmartShield</span>
          </div>
        </div>
        <div className={styles.navRight}>
          <div className={styles.userBadge}>
            <span className={styles.userEmail}>{user.email}</span>
            <span className={`${styles.roleBadge} ${isAdmin ? styles.adminBadge : styles.userBadgeRole}`}>
              {isAdmin ? "Admin" : "User"}
            </span>
          </div>
          <button id="logout-btn" className={styles.logoutBtn} onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </nav>

      {/* ─── Main Content ────────────── */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className={styles.statsGrid}>
              <StatusCard status={stats.status} />
              <TrafficCard count={stats.totalRequests} />
              <AttackCard count={stats.attackCount} />
              <BlockedIPCard count={stats.blockedCount} />
            </div>

            {/* Main Content Grid */}
            {isAdmin ? (
              /* ─── Admin: Split Layout ─── */
              <div className={styles.adminGrid}>
                <div className={styles.leftCol}>
                  <LiveGraph data={traffic} />
                  <div className={styles.bottomRow}>
                    <BlockedIPList ips={blockedIPs} />
                    <AlertsPanel alerts={alerts} />
                  </div>
                </div>
                <div className={styles.rightCol}>
                  <ControlPanel />
                </div>
              </div>
            ) : (
              /* ─── User: Full Width ─── */
              <div className={styles.userGrid}>
                <LiveGraph data={traffic} />
                <div className={styles.bottomRow}>
                  <BlockedIPList ips={blockedIPs} />
                  <AlertsPanel alerts={alerts} />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

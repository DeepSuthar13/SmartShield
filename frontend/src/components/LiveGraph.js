"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./LiveGraph.module.css";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTime}>{formatTime(label)}</p>
      {payload.map((entry, i) => (
        <p key={i} className={styles.tooltipRow} style={{ color: entry.color }}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

export default function LiveGraph({ data }) {
  const chartData = (data || []).map((d) => ({
    time: d.timestamp,
    Requests: d.requestCount || 0,
    Attacks: d.attackCount || 0,
  }));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Live Traffic
        </h3>
        <span className={styles.badge}>
          <span className={styles.liveDot} />
          LIVE
        </span>
      </div>
      <div className={styles.chartWrap}>
        {chartData.length === 0 ? (
          <div className={styles.empty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <p>Waiting for traffic data...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4361ee" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAttacks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7ee" vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fontSize: 11, fill: "#8e95a9" }}
                axisLine={{ stroke: "#e5e7ee" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8e95a9" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="Requests"
                stroke="#4361ee"
                strokeWidth={2.5}
                fill="url(#gradRequests)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="Attacks"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#gradAttacks)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

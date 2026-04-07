"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login(email, password);
      localStorage.setItem("smartshield_token", data.token);
      localStorage.setItem("smartshield_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Left decorative panel */}
        <div className={styles.heroPanel}>
          <div className={styles.heroContent}>
            <div className={styles.shieldIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h1 className={styles.heroTitle}>SmartShield</h1>
            <p className={styles.heroSubtitle}>
              Real-time DDoS Detection &amp; Mitigation System
            </p>
          </div>
          <div className={styles.heroPattern} />
        </div>

        {/* Login form */}
        <div className={styles.formPanel}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Welcome back</h2>
              <p className={styles.formSubtitle}>
                Sign in to access your dashboard
              </p>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                "Sign In"
              )}
            </button>

            <p className={styles.linkText}>
              Don't have an account?{" "}
              <Link href="/signup" className={styles.link}>
                Sign Up
              </Link>
            </p>

            <p className={styles.footerText}>
              Protected by SmartShield Security
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

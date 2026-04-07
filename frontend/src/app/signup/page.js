"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import styles from "./signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.register(email, password);
      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Signup failed");
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

        {/* Signup form */}
        <div className={styles.formPanel}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Create an Account</h2>
              <p className={styles.formSubtitle}>
                Sign up to start monitoring your infrastructure
              </p>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className={styles.errorBox} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {success}
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
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <button
              id="signup-submit"
              className={styles.submitBtn}
              type="submit"
              disabled={loading || !!success}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                "Sign Up"
              )}
            </button>

            <p className={styles.linkText}>
              Already have an account?{" "}
              <Link href="/login" className={styles.link}>
                Sign In
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

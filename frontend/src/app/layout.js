import "./globals.css";

export const metadata = {
  title: "SmartShield — DDoS Detection & Mitigation",
  description:
    "Real-time DDoS detection and mitigation dashboard with ML-based attack analysis, admin controls, and live traffic monitoring.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

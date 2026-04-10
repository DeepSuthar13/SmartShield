"""
engine.py — SmartShield Detection Engine (Main Orchestrator)

Pipeline:
1. Capture packets continuously (tcpdump -i any -nn)
2. Group packets into flows (Source IP + 5s tumbling window)
3. After window ends → compute 12 features from flow
4. Load ML model → predict (0 = normal, 1 = attack)
5. If attack detected:
   a. Read defence mode from Oracle DB (defence_config)
   b. Apply defence (block / rate_limit / captcha)
   c. Log to Oracle DB (attack_logs, alerts, ip_actions)
6. Push traffic stats to backend API (in-memory store)

MUST be run with sudo for tcpdump and iptables:
    sudo python3 engine.py
"""

import time
import signal
import sys
import requests

from capture import start_capture
from flow_builder import FlowBuilder
from feature_extractor import extract_features
from detector import Detector
from defender import apply_defence, get_defence_mode
from db_logger import get_connection, log_detection_result

# Backend API URL for pushing traffic stats
BACKEND_URL = "http://localhost:5000/api/dashboard/push-traffic"

# JWT token for authenticated requests (set via env or hardcode for internal use)
import os
BACKEND_TOKEN = os.environ.get("SMARTSHIELD_TOKEN", "")


def push_traffic_stats(request_count, attack_count, status):
    """Push traffic data to backend in-memory store via API."""
    try:
        headers = {}
        if BACKEND_TOKEN:
            headers["Authorization"] = f"Bearer {BACKEND_TOKEN}"
        headers["Content-Type"] = "application/json"

        requests.post(
            BACKEND_URL,
            json={
                "requestCount": request_count,
                "attackCount": attack_count,
                "status": status,
            },
            headers=headers,
            timeout=2,
        )
    except Exception as e:
        # Don't crash if backend is down
        pass


def main():
    print("=" * 60)
    print("🛡️  SmartShield Detection Engine")
    print("=" * 60)

    # Initialize components
    print("\n[ENGINE] Initializing components...")

    # 1. ML Detector
    detector = Detector()
    if not detector.is_ready():
        print("[ENGINE] ⚠️  WARNING: No ML model loaded. Place model.pkl in detection/ folder.")
        print("[ENGINE] Engine will still capture and build flows but cannot detect attacks.\n")

    # 2. Flow Builder (5-second tumbling window)
    flow_builder = FlowBuilder(window_duration=5, min_packets=5)

    # 3. Oracle DB connection
    db_conn = get_connection()
    if db_conn:
        print("[ENGINE] ✅ Oracle DB connected")
    else:
        print("[ENGINE] ⚠️  WARNING: No DB connection. Logging disabled.\n")

    # Graceful shutdown
    running = True

    def signal_handler(sig, frame):
        nonlocal running
        print("\n[ENGINE] Shutting down gracefully...")
        running = False

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Stats counters (per window)
    window_requests = 0
    window_attacks = 0

    import threading
    def stats_pusher():
        nonlocal window_requests, window_attacks, running
        while running:
            time.sleep(5)
            status = "under_attack" if window_attacks > 0 else "normal"
            push_traffic_stats(window_requests, window_attacks, status)
            
            # Reset counters for next window
            window_requests = 0
            window_attacks = 0

    # Start the background thread for pushing stats
    threading.Thread(target=stats_pusher, daemon=True).start()

    print("\n[ENGINE] 🔄 Starting packet capture...\n")

    try:
        for packet in start_capture():
            if not running:
                break

            window_requests += 1

            # Add packet to flow builder
            completed_flows = flow_builder.add_packet(packet)

            # Process completed flows (if any met the min_packets threshold)
            if completed_flows:
                for flow in completed_flows:
                    src_ip = flow["src_ip"]
                    pkt_count = flow["packet_count"]

                    # Extract 12 features
                    features = extract_features(flow)

                    # Get prediction from ML Model
                    prediction, confidence = detector.predict(features)

                    # Heuristic Override: If traffic is undeniably high, it's an attack regardless of ML model
                    # (Standard user traffic is usually < 10 PPS; 200 PPS is a very safe flood threshold)
                    ts = [p["timestamp"] for p in flow["packets"]]
                    raw_dur = max(ts) - min(ts) if len(ts) > 1 else 0.001
                    raw_pps = pkt_count / raw_dur
                    
                    is_heuristic_attack = raw_pps > 200

                    if prediction == 1 or is_heuristic_attack:
                        # ─── ATTACK DETECTED ─────────────────
                        window_attacks += 1
                        
                        reason = "Heuristic (High PPS)" if is_heuristic_attack and prediction == 0 else "ML Model"
                        print(f"🚨 ATTACK detected from {src_ip} ({reason})")
                        print(f"   [STATS] Packets: {pkt_count} | Confidence: {confidence*100:.1f}%")
                        print(f"   [FEATURES] Dur: {features[0]/1_000_000:.3f}s | PPS: {features[1]:.1f} | IAT_Mean: {features[2]:.4f}us | Size_Mean: {features[6]:.1f}")
                        print(f"   [FLAGS] SYN: {int(features[8])} | ACK: {int(features[9])} | RST: {int(features[10])} | PSH: {int(features[11])}")

                        # Read current defence mode from DB
                        mode = get_defence_mode()

                        print(f"   → Defence mode: {mode}")

                        # Apply defence
                        apply_defence(mode, src_ip)

                        # Log to DB
                        log_detection_result(None, src_ip, mode)
                    else:
                        if pkt_count > 100:
                            print(f"🔍 DEBUG (High Traffic Normal) from {src_ip}")
                            print(f"   [STATS] Packets: {pkt_count} | Confidence (Normal): {confidence*100:.1f}%")
                            print(f"   [FEATURES] Dur: {features[0]/1_000_000:.3f}s | PPS: {features[1]:.1f} | IAT_Mean: {features[2]:.4f}us | Size_Mean: {features[6]:.1f}")
                            print(f"   [FLAGS] SYN: {features[8]} | ACK: {features[9]} | RST: {features[10]} | PSH: {features[11]}")
                        else:
                            print(f"✅ Normal traffic from {src_ip} ({pkt_count} pkts)")

    except Exception as e:
        print(f"\n[ENGINE] ❌ Error: {e}")
    finally:
        # Flush remaining flows
        remaining = flow_builder.force_flush()
        if remaining:
            print(f"\n[ENGINE] Flushing {len(remaining)} remaining flows...")

        # Close DB connection
        if db_conn:
            try:
                db_conn.close()
                print("[ENGINE] Oracle DB connection closed")
            except:
                pass

        print("[ENGINE] 🛑 Engine stopped.\n")


if __name__ == "__main__":
    main()

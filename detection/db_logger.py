"""
db_logger.py — Log detection results to Oracle DB

Logs to:
- attack_logs: Every detected attack
- alerts: Human-readable alert messages
- ip_actions: Defence actions taken (with duplicate check)

Uses oracledb in thin mode only.
"""

import oracledb
import os
from datetime import datetime

# Oracle DB config from environment
DB_CONFIG = {
    "user": os.environ.get("ORACLE_USER", ""),
    "password": os.environ.get("ORACLE_PASSWORD", ""),
    "connectString": os.environ.get("ORACLE_URL", ""),
}


def get_connection():
    """Get an Oracle DB connection (thin mode)."""
    try:
        # oracledb.connect() is the modern way to connect in thin mode
        conn = oracledb.connect(**DB_CONFIG)
        print(f"[DB_LOGGER] ✅ Connected to Oracle DB (Thin Mode: {conn.thin})")
        return conn
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Connection failed: {e}")
        return None


def log_attack(connection, ip_address):
    """
    Insert into attack_logs table.
    """
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO attack_logs (ip_address) VALUES (:ip)",
            {"ip": ip_address},
        )
        connection.commit()
        cursor.close()
        print(f"[DB_LOGGER] Logged attack from: {ip_address}")
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Failed to log attack: {e}")


def log_alert(connection, message):
    """
    Insert into alerts table.
    """
    try:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO alerts (message) VALUES (:msg)",
            {"msg": message},
        )
        connection.commit()
        cursor.close()
        print(f"[DB_LOGGER] Alert: {message}")
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Failed to log alert: {e}")


def log_ip_action(connection, ip_address, action):
    """
    Insert into ip_actions table.
    Avoids duplicate entries for the same IP with active status.
    """
    try:
        cursor = connection.cursor()

        # Check for existing active action on this IP
        cursor.execute(
            """SELECT COUNT(*) FROM ip_actions 
               WHERE ip_address = :ip AND status = 'active'""",
            {"ip": ip_address},
        )
        count = cursor.fetchone()[0]

        if count > 0:
            print(f"[DB_LOGGER] IP {ip_address} already has active action — skipping duplicate")
            cursor.close()
            return

        # Insert new action
        cursor.execute(
            """INSERT INTO ip_actions (ip_address, action, status) 
               VALUES (:ip, :action, 'active')""",
            {"ip": ip_address, "action": action},
        )
        connection.commit()
        cursor.close()
        print(f"[DB_LOGGER] IP action logged: {ip_address} → {action}")
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Failed to log IP action: {e}")


def log_detection_result(connection, ip_address, action):
    """
    Full logging pipeline: attack_log + alert + ip_action.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 1. Log attack
    log_attack(connection, ip_address)

    # 2. Create alert
    alert_msg = f"[{timestamp}] DDoS attack detected from {ip_address} — Action: {action}"
    log_alert(connection, alert_msg)

    # 3. Log IP action (with duplicate avoidance)
    log_ip_action(connection, ip_address, action)

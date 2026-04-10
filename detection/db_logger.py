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

from dotenv import load_dotenv

# Load the backend's .env file
env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(dotenv_path=env_path)

# Initialize Thick Mode for Oracle DB (Required for encrypted connections on Linux)
lib_dir = os.environ.get("ORACLE_CLIENT_LIB_DIR", "")
if lib_dir and os.path.exists(lib_dir):
    try:
        oracledb.init_oracle_client(lib_dir=lib_dir)
        print(f"[DB_LOGGER] ✅ Oracle Thick Mode initialized using: {lib_dir}")
    except Exception as e:
        print(f"[DB_LOGGER] ⚠️  Oracle init_oracle_client failed: {e}")

# Oracle DB config from environment
DB_CONFIG = {
    "user": os.environ.get("ORACLE_USER", ""),
    "password": os.environ.get("ORACLE_PASSWORD", ""),
    "dsn": os.environ.get("ORACLE_URL", ""),
}


def get_connection():
    """Get an Oracle DB connection. (Singleton-like with retry)"""
    global _last_conn
    try:
        # If we have an existing connection, check if it's alive
        if '_last_conn' in globals() and _last_conn:
            try:
                _last_conn.ping()
                return _last_conn
            except:
                print("[DB_LOGGER] ⚠️  Connection stale, reconnecting...")
        
        _last_conn = oracledb.connect(**DB_CONFIG)
        print(f"[DB_LOGGER] ✅ Connected to Oracle DB")
        return _last_conn
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Connection failed: {e}")
        return None


def log_attack(connection, ip_address):
    """Insert into attack_logs table."""
    try:
        conn = get_connection() if connection is None else connection
        if not conn: return
        cursor = conn.cursor()
        cursor.execute("INSERT INTO attack_logs (ip_address) VALUES (:ip)", {"ip": ip_address})
        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Failed to log attack: {e}")


def log_alert(connection, message):
    """Insert into alerts table."""
    try:
        conn = get_connection() if connection is None else connection
        if not conn: return
        cursor = conn.cursor()
        cursor.execute("INSERT INTO alerts (message) VALUES (:msg)", {"msg": message})
        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Failed to log alert: {e}")


def is_ip_blocked(connection, ip_address):
    """Check if IP already has an active block/action."""
    try:
        conn = get_connection() if connection is None else connection
        if not conn: return False
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM ip_actions WHERE ip_address = :ip AND status = 'active'",
            {"ip": ip_address}
        )
        count = cursor.fetchone()[0]
        cursor.close()
        return count > 0
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Error checking IP status: {e}")
        return False


def log_ip_action(connection, ip_address, action):
    """Insert into ip_actions table if not already active."""
    try:
        conn = get_connection() if connection is None else connection
        if not conn: return
        
        if is_ip_blocked(conn, ip_address):
            return

        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO ip_actions (ip_address, action, status) VALUES (:ip, :action, 'active')",
            {"ip": ip_address, "action": action}
        )
        conn.commit()
        cursor.close()
        print(f"[DB_LOGGER] ✅ IP action logged: {ip_address} → {action}")
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Failed to log IP action: {e}")


def log_detection_result(connection, ip_address, action):
    """Full logging pipeline: attack_log + alert + ip_action (Silenced if already blocked)."""
    try:
        conn = get_connection() if connection is None else connection
        if not conn: return

        # IMPORTANT: If IP is already blocked, don't flood the logs!
        if is_ip_blocked(conn, ip_address):
            # We don't print anything here to keep terminal clean
            return

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 1. Log attack
        log_attack(conn, ip_address)

        # 2. Create alert
        alert_msg = f"[{timestamp}] DDoS attack detected from {ip_address} — Action: {action}"
        log_alert(conn, alert_msg)

        # 3. Log IP action
        log_ip_action(conn, ip_address, action)
    except Exception as e:
        print(f"[DB_LOGGER] ❌ Detection logging failed: {e}")

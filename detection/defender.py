"""
defender.py — Apply defence actions based on current mode

Defence Modes:
1. block      → iptables -A INPUT -s <IP> -j DROP
2. rate_limit → Update Nginx rate limit config
3. captcha    → Mark IP in ip_actions for CAPTCHA challenge

Reads defence mode from Oracle DB (defence_config table).
Avoids duplicate IP actions.
"""

import subprocess
import os


def apply_defence(mode, ip_address, db_connection=None):
    """
    Apply the specified defence action against an IP.
    
    Args:
        mode: 'block' | 'rate_limit' | 'captcha'
        ip_address: The attacking IP address
        db_connection: Oracle DB connection for logging
    
    Returns:
        bool: True if action was applied successfully
    """
    if mode == "block":
        return _block_ip(ip_address)
    elif mode == "rate_limit":
        return _rate_limit_ip(ip_address)
    elif mode == "captcha":
        return _captcha_mark(ip_address)
    else:
        print(f"[DEFENDER] Unknown mode: {mode}")
        return False


def _block_ip(ip_address):
    """
    Block IP using iptables.
    Command: iptables -A INPUT -s <IP> -j DROP
    """
    try:
        # Check if rule already exists to avoid duplicates
        check = subprocess.run(
            ["sudo", "iptables", "-C", "INPUT", "-s", ip_address, "-j", "DROP"],
            capture_output=True,
            text=True,
        )

        if check.returncode == 0:
            print(f"[DEFENDER] IP {ip_address} already blocked in iptables")
            return True

        # Add the block rule
        result = subprocess.run(
            ["sudo", "iptables", "-A", "INPUT", "-s", ip_address, "-j", "DROP"],
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            print(f"[DEFENDER] ✅ Blocked IP: {ip_address} (iptables)")
            return True
        else:
            print(f"[DEFENDER] ❌ Failed to block {ip_address}: {result.stderr}")
            return False
    except Exception as e:
        print(f"[DEFENDER] ❌ iptables error: {e}")
        return False


def _rate_limit_ip(ip_address):
    """
    Apply rate limiting via Nginx.
    Writes IP to a rate-limited IPs file that Nginx reads.
    """
    try:
        rate_limit_file = "/etc/nginx/conf.d/smartshield_ratelimit.conf"

        # Create/append the rate limit map entry
        entry = f'    "{ip_address}" 1;\n'

        # Check if IP already exists
        if os.path.exists(rate_limit_file):
            with open(rate_limit_file, "r") as f:
                if ip_address in f.read():
                    print(f"[DEFENDER] IP {ip_address} already rate-limited")
                    return True

        # Write rate limit entry
        with open(rate_limit_file, "a") as f:
            f.write(entry)

        # Reload Nginx
        subprocess.run(
            ["sudo", "nginx", "-s", "reload"],
            capture_output=True,
            text=True,
        )

        print(f"[DEFENDER] ✅ Rate-limited IP: {ip_address} (Nginx)")
        return True
    except Exception as e:
        print(f"[DEFENDER] ❌ Rate limit error: {e}")
        return False


def _captcha_mark(ip_address):
    """
    Mark IP for CAPTCHA challenge.
    The IP is marked in ip_actions table (handled by db_logger).
    This function just logs the intent.
    """
    print(f"[DEFENDER] ✅ Marked IP for CAPTCHA: {ip_address}")
    return True


def get_defence_mode(connection):
    """
    Read current defence mode from Oracle DB.
    
    Args:
        connection: Oracle DB connection
    
    Returns:
        str: 'block' | 'rate_limit' | 'captcha'
    """
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT modes FROM defence_config WHERE ROWNUM = 1")
        row = cursor.fetchone()
        cursor.close()

        if row:
            return row[0]
        return "block"  # Default
    except Exception as e:
        print(f"[DEFENDER] ❌ Failed to read defence mode: {e}")
        return "block"

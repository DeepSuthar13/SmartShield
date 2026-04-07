"""
capture.py — Packet capture using tcpdump

Runs: tcpdump -i any -nn
Parses raw output into structured packet dicts.
"""

import subprocess
import re
import time


def start_capture():
    """
    Start tcpdump as a subprocess and yield parsed packets.
    Must be run with sudo privileges.
    
    Yields:
        dict: { src_ip, dst_ip, size, timestamp, flags }
    """
    cmd = [
        "sudo", "tcpdump",
        "-i", "any",     # All interfaces
        "-nn",           # No DNS lookup (faster)
        "-l",            # Line-buffered output
        "-q",            # Quiet (less verbose)
        "--immediate-mode",
    ]

    print("[CAPTURE] Starting tcpdump: " + " ".join(cmd))

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        universal_newlines=True,
        bufsize=1,
    )

    try:
        for line in process.stdout:
            packet = parse_tcpdump_line(line.strip())
            if packet:
                yield packet
    except KeyboardInterrupt:
        print("[CAPTURE] Stopping tcpdump...")
    finally:
        process.terminate()
        process.wait()


def parse_tcpdump_line(line):
    """
    Parse a tcpdump -q line into a structured packet dict.
    
    Example tcpdump -q output:
    14:30:25.123456 IP 192.168.1.5.12345 > 10.0.0.1.80: tcp 52
    """
    if not line or "IP" not in line:
        return None

    try:
        # Extract timestamp
        timestamp_match = re.match(r'^(\d{2}:\d{2}:\d{2}\.\d+)', line)
        if not timestamp_match:
            return None
        timestamp_str = timestamp_match.group(1)

        # Extract IPs
        ip_pattern = r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d+)\s+>\s+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d+)'
        ip_match = re.search(ip_pattern, line)
        if not ip_match:
            return None

        src_ip = ip_match.group(1)
        src_port = int(ip_match.group(2))
        dst_ip = ip_match.group(3)
        dst_port = int(ip_match.group(4))

        # Extract size (last number in line after "tcp" or "udp")
        size_match = re.search(r'(?:tcp|udp|icmp)\s+(\d+)', line, re.IGNORECASE)
        size = int(size_match.group(1)) if size_match else 0

        # Detect TCP flags from verbose output
        flags = extract_flags(line)

        return {
            "timestamp": time.time(),
            "timestamp_str": timestamp_str,
            "src_ip": src_ip,
            "src_port": src_port,
            "dst_ip": dst_ip,
            "dst_port": dst_port,
            "size": size,
            "flags": flags,
        }
    except Exception:
        return None


def extract_flags(line):
    """
    Extract TCP flags from tcpdump output.
    Returns dict of flag counts for this packet.
    """
    flags = {"SYN": 0, "ACK": 0, "RST": 0, "PSH": 0}

    # tcpdump -q doesn't show flags, but verbose mode does
    # For -q mode, we look for flag indicators
    line_upper = line.upper()

    if "[S]" in line or "SYN" in line_upper:
        flags["SYN"] = 1
    if "[.]" in line or "ACK" in line_upper:
        flags["ACK"] = 1
    if "[R]" in line or "RST" in line_upper:
        flags["RST"] = 1
    if "[P]" in line or "PSH" in line_upper:
        flags["PSH"] = 1
    # Combined flags
    if "[S.]" in line:
        flags["SYN"] = 1
        flags["ACK"] = 1
    if "[P.]" in line:
        flags["PSH"] = 1
        flags["ACK"] = 1

    return flags

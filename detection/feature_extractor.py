"""
feature_extractor.py — Extract ML features from a flow

Each flow → 1 feature vector → 1 ML prediction

12 Features (must match training data exactly):
1.  flow_duration       — Duration of the flow in seconds
2.  packets_per_sec     — Packets per second
3.  iat_mean            — Mean inter-arrival time
4.  iat_std             — Std dev of inter-arrival time
5.  packet_size_min     — Minimum packet size
6.  packet_size_max     — Maximum packet size
7.  packet_size_mean    — Mean packet size
8.  packet_size_std     — Std dev of packet size
9.  syn_count           — Number of SYN packets
10. ack_count           — Number of ACK packets
11. rst_count           — Number of RST packets
12. psh_count           — Number of PSH packets
"""

import numpy as np


def extract_features(flow):
    """
    Extract 12 features from a flow dict.
    
    Args:
        flow: dict with keys:
            - src_ip: str
            - packets: list of packet dicts
            - packet_count: int
            - window_start: float
            - window_end: float
    
    Returns:
        list: [flow_duration, packets_per_sec, iat_mean, iat_std,
               packet_size_min, packet_size_max, packet_size_mean, packet_size_std,
               syn_count, ack_count, rst_count, psh_count]
    """
    packets = flow["packets"]
    n = len(packets)

    if n == 0:
        return [0.0] * 12

    # ─── 1. Flow Duration ────────────────────────
    timestamps = [p["timestamp"] for p in packets]
    flow_duration = max(timestamps) - min(timestamps)
    if flow_duration == 0:
        flow_duration = 0.001  # Avoid division by zero

    # ─── 2. Packets Per Second ───────────────────
    packets_per_sec = n / flow_duration

    # ─── 3-4. Inter-arrival Time ─────────────────
    if n > 1:
        sorted_ts = sorted(timestamps)
        iats = [sorted_ts[i+1] - sorted_ts[i] for i in range(len(sorted_ts) - 1)]
        iat_mean = float(np.mean(iats))
        iat_std = float(np.std(iats))
    else:
        iat_mean = 0.0
        iat_std = 0.0

    # ─── 5-8. Packet Size Stats ──────────────────
    sizes = [p["size"] for p in packets]
    packet_size_min = float(min(sizes))
    packet_size_max = float(max(sizes))
    packet_size_mean = float(np.mean(sizes))
    packet_size_std = float(np.std(sizes))

    # ─── 9-12. TCP Flag Counts ───────────────────
    syn_count = sum(p["flags"].get("SYN", 0) for p in packets)
    ack_count = sum(p["flags"].get("ACK", 0) for p in packets)
    rst_count = sum(p["flags"].get("RST", 0) for p in packets)
    psh_count = sum(p["flags"].get("PSH", 0) for p in packets)

    features = [
        flow_duration,
        packets_per_sec,
        iat_mean,
        iat_std,
        packet_size_min,
        packet_size_max,
        packet_size_mean,
        packet_size_std,
        float(syn_count),
        float(ack_count),
        float(rst_count),
        float(psh_count),
    ]

    return features

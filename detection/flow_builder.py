"""
flow_builder.py — Group packets into flows using tumbling windows

CRITICAL FLOW WINDOW PROCESSING:
- DO NOT process packets individually
- Group packets by Source IP within a fixed time window (5 seconds)
- Each flow = all packets from same IP within one window
- After window ends → compute features → predict → reset

Uses TUMBLING windows (non-overlapping).
"""

import time
from collections import defaultdict

# Flow window duration in seconds
WINDOW_DURATION = 0.1

# Minimum packets required to consider a flow valid
MIN_PACKETS_PER_FLOW = 5


class FlowBuilder:
    """
    Accumulates packets and emits complete flows when the time window expires.
    
    Flow Key: Source IP
    Window: 5 seconds (tumbling)
    """

    def __init__(self, window_duration=WINDOW_DURATION, min_packets=MIN_PACKETS_PER_FLOW):
        self.window_duration = window_duration
        self.min_packets = min_packets
        self.current_window_start = time.time()
        self.flows = defaultdict(list)  # { src_ip: [packet, packet, ...] }

    def add_packet(self, packet):
        """
        Add a packet to the current window.
        Returns list of completed flows if window has expired, else empty list.
        """
        now = time.time()
        completed_flows = []

        # Check if current window has expired
        if now - self.current_window_start >= self.window_duration:
            completed_flows = self._flush_flows()
            self.current_window_start = now

        # Add packet to its flow (keyed by source IP)
        src_ip = packet["src_ip"]
        self.flows[src_ip].append(packet)

        return completed_flows

    def _flush_flows(self):
        """
        Flush all accumulated flows and return them.
        Only returns flows with >= min_packets.
        """
        completed = []

        for src_ip, packets in self.flows.items():
            if len(packets) >= self.min_packets:
                completed.append({
                    "src_ip": src_ip,
                    "packets": packets,
                    "packet_count": len(packets),
                    "window_start": self.current_window_start,
                    "window_end": time.time(),
                })

        # Reset flows for next window
        self.flows = defaultdict(list)

        return completed

    def force_flush(self):
        """Force flush remaining flows (e.g., on shutdown)."""
        return self._flush_flows()

import joblib
import numpy as np
import os
import sys

# Simulation Multiplier (must match feature_extractor.py)
SIMULATION_MULTIPLIER = 500.0

def predict_mock(pkt_count, dur_secs, model, flags):
    # Calculate features
    raw_pps = pkt_count / dur_secs
    iat_mean_raw = (dur_secs * 1_000_000) / pkt_count if pkt_count > 0 else 0
    
    # Scale features
    pps_scaled = raw_pps * SIMULATION_MULTIPLIER
    iat_scaled = iat_mean_raw / SIMULATION_MULTIPLIER
    dur_scaled = dur_secs * 1_000_000
    
    # [dur, pps, iat, std, min, max, mean, std, syn, ack, rst, psh]
    # flags scaled
    feat = [dur_scaled, pps_scaled, iat_scaled, 100.0, 0.0, 1500.0, flags['size'], 10.0, 
            flags['syn']*SIMULATION_MULTIPLIER, flags['ack']*SIMULATION_MULTIPLIER, 
            flags['rst']*SIMULATION_MULTIPLIER, flags['psh']*SIMULATION_MULTIPLIER]
    
    X = np.array(feat).reshape(1, -1)
    ml_pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    
    # Heuristic
    heuristic_pred = 1 if raw_pps > 200 else 0
    
    final_pred = 1 if ml_pred == 1 or heuristic_pred == 1 else 0
    
    return {
        "raw_pps": raw_pps,
        "ml_pred": "ATTACK" if ml_pred == 1 else "NORMAL",
        "heuristic_pred": "ATTACK" if heuristic_pred == 1 else "NORMAL",
        "final": "ATTACK" if final_pred == 1 else "NORMAL",
        "confidence_attack": proba[1]
    }

def main():
    model = joblib.load("model.pkl")
    
    # Test case: The attacker from logs (864 PPS)
    # 4311 pkts in 5s
    res = predict_mock(4311, 5.0, model, {'size': 33.2, 'syn': 0, 'ack': 4311, 'rst': 0, 'psh': 100})
    print(f"Attacker (864 PPS): Raw PPS={res['raw_pps']:.1f}, ML={res['ml_pred']}, Heuristic={res['heuristic_pred']} -> Final={res['final']}")

    # Test case: Low traffic (20 PPS)
    res = predict_mock(100, 5.0, model, {'size': 64.0, 'syn': 0, 'ack': 100, 'rst': 0, 'psh': 10})
    print(f"Normal (20 PPS):   Raw PPS={res['raw_pps']:.1f}, ML={res['ml_pred']}, Heuristic={res['heuristic_pred']} -> Final={res['final']}")

if __name__ == "__main__":
    main()

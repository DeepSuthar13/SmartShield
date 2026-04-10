import pandas as pd
import numpy as np

# =========================
# 1. FILE PATHS
# =========================
input_path = "Dataset.csv"
output_path = "smartshield_cleaned.csv"

# =========================
# 2. LOAD DATASET
# =========================
df = pd.read_csv(input_path)
df.columns = df.columns.str.strip()

print("Original Shape:", df.shape)

# =========================
# 3. TIMESTAMP (FOR FLOW BUILDING)
# =========================
df['Timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce')

# =========================
# 4. SELECT + RENAME FINAL FEATURES
# =========================
feature_mapping = {
    'Flow Duration': 'flow_duration',
    'Flow Packets/s': 'packets_per_sec',
    'Flow IAT Mean': 'iat_mean',
    'Flow IAT Std': 'iat_std',
    'Min Packet Length': 'packet_size_min',
    'Max Packet Length': 'packet_size_max',
    'Packet Length Mean': 'packet_size_mean',
    'Packet Length Std': 'packet_size_std',
    'SYN Flag Count': 'syn_count',
    'ACK Flag Count': 'ack_count',
    'RST Flag Count': 'rst_count',
    'PSH Flag Count': 'psh_count',
}

# Keep only required columns
df = df[['Timestamp'] + list(feature_mapping.keys()) + ['Label']]

# Rename columns to match runtime features
df.rename(columns=feature_mapping, inplace=True)

print("After Feature Selection:", df.shape)

# =========================
# 5. LABEL ENCODING
# =========================
df['Label'] = df['Label'].astype(str).str.strip()

df['target'] = df['Label'].apply(
    lambda x: 1 if 'ddos' in x.lower() else 0
)

df.drop(columns=['Label'], inplace=True)

# =========================
# 6. CLEAN DATA
# =========================
df.replace([np.inf, -np.inf], np.nan, inplace=True)

# Drop invalid timestamps
df = df.dropna(subset=['Timestamp'])

# Fill remaining NaN
df.fillna(0, inplace=True)

# =========================
# 7. FINAL FEATURE ORDER (CRITICAL)
# =========================
final_features = [
    'flow_duration',
    'packets_per_sec',
    'iat_mean',
    'iat_std',
    'packet_size_min',
    'packet_size_max',
    'packet_size_mean',
    'packet_size_std',
    'syn_count',
    'ack_count',
    'rst_count',
    'psh_count'
]

df = df[['Timestamp'] + final_features + ['target']]

# =========================
# 8. VALIDATION CHECK
# =========================
print("\nFinal Columns:", df.columns.tolist())
print("\nNull values:\n", df.isnull().sum())

# =========================
# 9. SAVE CLEAN DATASET
# =========================
df.to_csv(output_path, index=False)

print("\n✅ Clean dataset saved at:", output_path)
print("Final Shape:", df.shape)

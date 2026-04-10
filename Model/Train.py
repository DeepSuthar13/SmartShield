import pandas as pd

# =========================
# 1. FILE PATHS
# =========================
input_path = "smartshield_cleaned.csv"

train_output_path = "smartshield_train.csv"
test_output_path = "smartshield_test.csv"

# =========================
# 2. LOAD DATA
# =========================
df = pd.read_csv(input_path)

# Convert timestamp safely
df['Timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce')

# Drop invalid timestamps
df = df.dropna(subset=['Timestamp'])

print("Total Dataset Shape:", df.shape)

# =========================
# 3. SORT BY TIME
# =========================
df = df.sort_values(by='Timestamp')

# =========================
# 4. FINAL FEATURE ORDER (CRITICAL)
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

required_columns = ['Timestamp'] + final_features + ['target']

# Ensure all columns exist
missing = [col for col in required_columns if col not in df.columns]
if missing:
    raise Exception(f"❌ Missing columns: {missing}")

# Enforce column order
df = df[required_columns]

# =========================
# 5. SPLIT (80% TRAIN, 20% TEST)
# =========================
split_index = int(len(df) * 0.8)

train_df = df.iloc[:split_index].copy()
test_df = df.iloc[split_index:].copy()

# =========================
# 6. DROP TIMESTAMP (NOT USED IN MODEL)
# =========================
train_df = train_df.drop(columns=['Timestamp'])
test_df = test_df.drop(columns=['Timestamp'])

# =========================
# 7. SAVE FILES
# =========================
train_df.to_csv(train_output_path, index=False)
test_df.to_csv(test_output_path, index=False)

# =========================
# 8. VERIFY
# =========================
print("\n✅ Time-Based Split Completed!")

print("\nTrain Shape:", train_df.shape)
print("Test Shape:", test_df.shape)

print("\nTrain Label Distribution:")
print(train_df['target'].value_counts(normalize=True))

print("\nTest Label Distribution:")
print(test_df['target'].value_counts(normalize=True))

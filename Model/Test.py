import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

# =========================
# 1. FILE PATHS
# =========================
train_path = "smartshield_train.csv"
test_path = "smartshield_test.csv"

model_save_path = "smartshield_model.pkl"
feature_save_path = "feature_order.pkl"

# =========================
# 2. FINAL FEATURE ORDER (CRITICAL)
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

# =========================
# 3. LOAD DATA
# =========================
train_df = pd.read_csv(train_path)
test_df = pd.read_csv(test_path)

print("Train Shape:", train_df.shape)
print("Test Shape:", test_df.shape)

# =========================
# 4. VALIDATION CHECK
# =========================
missing_train = [col for col in final_features if col not in train_df.columns]
missing_test = [col for col in final_features if col not in test_df.columns]

if missing_train or missing_test:
    raise Exception(f"❌ Missing columns: {missing_train + missing_test}")

# =========================
# 5. SPLIT FEATURES & TARGET (SAFE)
# =========================
X_train = train_df[final_features]
y_train = train_df['target']

X_test = test_df[final_features]
y_test = test_df['target']

# =========================
# 6. TRAIN MODEL
# =========================
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=10,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

print("\n✅ Model Training Completed!")

# =========================
# 7. EVALUATION
# =========================
y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\n🎯 Accuracy:", accuracy)

print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred))

print("\n📉 Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# =========================
# 8. FEATURE IMPORTANCE
# =========================
feature_importance = pd.DataFrame({
    'Feature': final_features,
    'Importance': model.feature_importances_
}).sort_values(by='Importance', ascending=False)

print("\n🔥 Top Important Features:")
print(feature_importance.head(10))

# =========================
# 9. SAVE MODEL + FEATURE ORDER
# =========================
joblib.dump(model, model_save_path)
joblib.dump(final_features, feature_save_path)

print("\n💾 Model saved at:", model_save_path)
print("💾 Feature order saved at:", feature_save_path)

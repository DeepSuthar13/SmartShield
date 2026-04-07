"""
detector.py — Load ML model and predict attacks

Loads model.pkl using joblib.
Input: 12-feature vector from feature_extractor.
Output: prediction (0 = normal, 1 = attack)
"""

import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")


class Detector:
    """ML-based attack detector using pre-trained model."""

    def __init__(self, model_path=MODEL_PATH):
        self.model = None
        self.model_path = model_path
        self._load_model()

    def _load_model(self):
        """Load the trained ML model from disk."""
        if not os.path.exists(self.model_path):
            print(f"[DETECTOR] ⚠️  Model not found at {self.model_path}")
            print("[DETECTOR] Detection will not work without a trained model.")
            return

        try:
            self.model = joblib.load(self.model_path)
            print(f"[DETECTOR] ✅ Model loaded from {self.model_path}")
        except Exception as e:
            print(f"[DETECTOR] ❌ Failed to load model: {e}")
            self.model = None

    def predict(self, features):
        """
        Predict if a flow is an attack.
        
        Args:
            features: list of 12 features
            
        Returns:
            int: 1 = attack, 0 = normal
            float: confidence score (probability)
        """
        if self.model is None:
            print("[DETECTOR] No model loaded — skipping prediction")
            return 0, 0.0

        try:
            X = np.array(features).reshape(1, -1)
            prediction = int(self.model.predict(X)[0])

            # Try to get probability if model supports it
            confidence = 0.0
            if hasattr(self.model, "predict_proba"):
                proba = self.model.predict_proba(X)[0]
                confidence = float(max(proba))

            return prediction, confidence
        except Exception as e:
            print(f"[DETECTOR] Prediction error: {e}")
            return 0, 0.0

    def is_ready(self):
        """Check if model is loaded and ready."""
        return self.model is not None

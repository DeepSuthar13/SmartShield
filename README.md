# 🛡️ SmartShield — Real-Time DDoS Detection & Mitigation

SmartShield is a cutting-edge, multi-tier security solution designed to protect web applications from Distributed Denial of Service (DDoS) attacks. It combines **Machine Learning**, **Real-time Packet Inspection**, and **Dynamic Reverse Proxying** to identify and neutralize threats before they reach your application server.

---

## 🏛️ Project Architecture

The system is composed of five interconnected layers:

1.  **🚀 Detection Engine (Python):** The software's "Brain". It captures live network packets, extracts features into 5-second tumbling windows, and uses a pre-trained Scikit-learn model to classify traffic as "Normal" or "Attack".
2.  **🛡️ Reverse Proxy (Nginx):** The "Shield". It handles all incoming traffic and dynamically applies rate-limiting or CAPTCHA redirections based on signals from the Detection Engine.
3.  **⚙️ Backend API (Node.js/Express):** The "Nervous System". It serves the dashboard API, manages user authentication, and coordinates data flow between the engine and the database.
4.  **📊 Frontend Dashboard (Next.js/React):** The "Eyes". A premium, high-fidelity monitoring interface that visualizes traffic trends, attack logs, and system status in real-time.
5.  **🗄️ Database (Oracle DB):** The "Memory". Stores attack logs, mitigation history, user credentials, and global defense configurations.

---

## ✨ Key Features

*   **ML-Powered Detection:** Uses a Scikit-learn Random Forest model trained on network flow features to detect volumetric and application-layer DDoS.
*   **Packet Sniffing:** Real-time capture using `tcpdump` and asynchronous flow building.
*   **Adaptive Mitigation:** Supports three defense modes:
    *   **Block:** Immediate IP dropping via iptables/Nginx.
    *   **Rate Limit:** Dynamic limiting to 10 requests per second.
    *   **CAPTCHA:** Automated redirection for suspicious traffic.
*   **Live Monitoring:** Dynamic charts powered by Recharts showing requests vs. attacks per second.
*   **Threat Intelligence:** Persistent logging of attacker IPs and timestamps for post-mortem analysis.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16, React 19, Recharts, TailwindCSS (Luxe) |
| **Backend** | Node.js, Express.js, JSON Web Tokens (JWT), Bcrypt |
| **Detection** | Python 3, Scikit-learn, Joblib, Tcpdump |
| **Database** | Oracle Database (Free/ATP/On-Prem) |
| **Server** | Nginx (Dynamic Configuration) |

---

## 🚀 Installation & Setup

### 1. Database Configuration
1. Login to your Oracle Database instance.
2. Execute the schema script found in `/database/schema.sql`.
3. Ensure you have the `libclntsh` library (provided by Oracle Instant Client) installed if running locally.

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your Oracle DB credentials and JWT_SECRET in .env
npm run start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Detection Engine Setup
1. Install Python dependencies:
   ```bash
   pip install -r detection/requirements.txt
   ```
2. Place your trained `model.pkl` in the `detection/` directory.
3. Run the engine with root privileges (required for packet capture):
   ```bash
   sudo python3 detection/engine.py
   ```

### 5. Nginx Configuration
1. Copy the configuration file:
   ```bash
   sudo cp nginx/smartshield.conf /etc/nginx/sites-available/
   sudo ln -s /etc/nginx/sites-available/smartshield.conf /etc/nginx/sites-enabled/
   ```
2. Create the placeholder dynamic config files:
   ```bash
   sudo touch /etc/nginx/conf.d/smartshield_ratelimit.conf
   sudo touch /etc/nginx/conf.d/smartshield_captcha.conf
   ```
3. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

---

## 🔄 System Workflow

1.  **Ingestion:** `capture.py` captures every packet traversing the network interface.
2.  **Analysis:** `flow_builder.py` groups packets into flows; `feature_extractor.py` computes metrics like mean packet size and arrival rate.
3.  **Inference:** `detector.py` uses the ML model to flag the IP if the traffic pattern is malicious.
4.  **Mitigation:** `defender.py` updates the Nginx dynamic config files and logs the entry to the Oracle Database.
5.  **Visualization:** The Next.js frontend polls the backend to display the updated attack state on the dashboard.

---
*Disclaimer: SmartShield is intended for educational purposes. Ensure you have permission before monitoring network traffic on any infrastructure.*


-- ============================================
-- SmartShield Database Schema (Oracle DB)
-- ============================================

-- Users table
CREATE TABLE users (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR2(255) UNIQUE NOT NULL,
    password_hash CLOB NOT NULL,
    role VARCHAR2(10) DEFAULT 'user' 
        CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTPs table (reserved for future use)
CREATE TABLE otps (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR2(255) NOT NULL,
    otp_code VARCHAR2(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified NUMBER(1) DEFAULT 0 
        CHECK (verified IN (0,1))
);

-- Attack logs
CREATE TABLE attack_logs (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ip_address VARCHAR2(45),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IP actions (block, rate_limit, captcha)
CREATE TABLE ip_actions (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ip_address VARCHAR2(45) NOT NULL,
    action VARCHAR2(20) 
        CHECK (action IN ('block', 'rate_limit', 'captcha')),
    status VARCHAR2(20) DEFAULT 'active'
        CHECK (status IN ('active', 'released')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts
CREATE TABLE alerts (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Defence configuration
CREATE TABLE defence_config (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    modes VARCHAR2(20) DEFAULT 'block'
        CHECK (modes IN ('block', 'rate_limit', 'captcha')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default defence mode
INSERT INTO defence_config (modes) VALUES ('block');

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_ip_actions_ip ON ip_actions(ip_address);
CREATE INDEX idx_attack_logs_ip ON attack_logs(ip_address);
CREATE INDEX idx_ip_actions_status ON ip_actions(status);
CREATE INDEX idx_alerts_created ON alerts(created_at);

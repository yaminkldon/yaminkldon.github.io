CREATE DATABASE IF NOT EXISTS yaminkldon_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yaminkldon_app;

CREATE TABLE IF NOT EXISTS users (
  uid VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NULL,
  device_id VARCHAR(255) NULL,
  user_type VARCHAR(32) NOT NULL DEFAULT 'student',
  plan VARCHAR(32) NOT NULL DEFAULT 'Monthly',
  subscription_status VARCHAR(32) NOT NULL DEFAULT 'active',
  started_at BIGINT NULL,
  expiration_date BIGINT NULL,
  register_token VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS register_tokens (
  token VARCHAR(128) PRIMARY KEY,
  duration_days INT NOT NULL,
  plan VARCHAR(32) NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  used_by_uid VARCHAR(64) NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token VARCHAR(128) PRIMARY KEY,
  uid VARCHAR(64) NOT NULL,
  email VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_sessions_uid(uid),
  INDEX idx_auth_sessions_email(email)
);

CREATE TABLE IF NOT EXISTS app_kv (
  path VARCHAR(512) PRIMARY KEY,
  value_json JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_objects (
  path VARCHAR(512) PRIMARY KEY,
  data_url LONGTEXT NOT NULL,
  mime_type VARCHAR(128) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO register_tokens(token, duration_days, plan, is_used)
VALUES
  ('DEMO30', 30, 'Monthly', 0),
  ('DEMO90', 90, 'Quarterly', 0),
  ('DEMO365', 365, 'Yearly', 0)
ON DUPLICATE KEY UPDATE token = token;

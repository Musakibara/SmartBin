-- =============================================================================
-- SMARTBIN — AIoT Smart Waste Monitoring Platform
-- Schéma MySQL 8+ (UUID, InnoDB, contraintes, index)
-- Reflète l'état réel du projet Laravel (2026-06-22)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS smartbin
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smartbin;

-- =============================================================================
-- 1. USERS — Authentification, rôles et suivi d'activité
-- =============================================================================
CREATE TABLE users (
    id              CHAR(36) PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password        VARCHAR(255) NOT NULL,
    remember_token  VARCHAR(100) NULL,
    role            ENUM('ADMIN','SUPERVISEUR','OPERATEUR','TECHNICIEN','AGENT')
                        NOT NULL DEFAULT 'AGENT',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        COMMENT 'ACTIVE | SUSPENDED',
    last_active_at  TIMESTAMP NULL,
    phone           VARCHAR(30) NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_status (status),
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- =============================================================================
-- 2. BINS — Bennes connectées avec géolocalisation
-- =============================================================================
CREATE TABLE bins (
    id              CHAR(36) PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE
                        COMMENT 'Identifiant métier ex: BIN-001',
    name            VARCHAR(150) NULL
                        COMMENT 'Nom / quartier de la benne',
    location        VARCHAR(255) NOT NULL
                        COMMENT 'Adresse descriptive',
    latitude        DECIMAL(10,7) NULL
                        COMMENT 'Coordonnée GPS (Leaflet)',
    longitude       DECIMAL(10,7) NULL
                        COMMENT 'Coordonnée GPS (Leaflet)',
    status          ENUM('NORMAL','WARNING','FULL') DEFAULT 'NORMAL',
    fill_level      FLOAT DEFAULT 0
                        COMMENT 'Niveau de remplissage 0-100',
    lid_status      ENUM('OPEN','CLOSED') DEFAULT 'CLOSED',
    battery_level   FLOAT DEFAULT 100
                        COMMENT 'Niveau batterie 0-100',
    last_update     TIMESTAMP NULL
                        COMMENT 'Dernière communication IoT',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_bins_status (status),
    INDEX idx_bins_location (location)
) ENGINE=InnoDB;

-- =============================================================================
-- 3. SENSORS — Capteurs physiques attachés aux bennes
-- =============================================================================
CREATE TABLE sensors (
    id          CHAR(36) PRIMARY KEY,
    bin_id      CHAR(36) NOT NULL,
    type        VARCHAR(100) DEFAULT 'ULTRASONIC'
                    COMMENT 'ULTRASONIC | WEIGHT | TEMPERATURE | BATTERY',
    model       VARCHAR(100) DEFAULT 'HC-SR04',
    status      ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_sensors_bin (bin_id),

    CONSTRAINT fk_sensors_bin
        FOREIGN KEY (bin_id) REFERENCES bins(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 4. SENSOR_READINGS — Historique des lectures IoT (time-series)
-- =============================================================================
CREATE TABLE sensor_readings (
    id                CHAR(36) PRIMARY KEY,
    bin_id            CHAR(36) NOT NULL,
    distance          FLOAT NULL
                        COMMENT 'Distance mesurée en cm',
    fill_level        FLOAT NOT NULL
                        COMMENT 'Niveau déduit 0-100',
    detected_presence BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NULL DEFAULT NULL
                        COMMENT 'Ajouté pour tracking des corrections',

    INDEX idx_readings_bin (bin_id),
    INDEX idx_readings_created (created_at),

    CONSTRAINT fk_readings_bin
        FOREIGN KEY (bin_id) REFERENCES bins(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 5. ALERTS — Événements et seuils critiques
-- =============================================================================
CREATE TABLE alerts (
    id          CHAR(36) PRIMARY KEY,
    bin_id      CHAR(36) NOT NULL,
    type        ENUM('BIN_FULL','BATTERY_LOW','SENSOR_ERROR','OVERFLOW_RISK')
                    NOT NULL,
    message     TEXT NULL,
    severity    ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'MEDIUM',
    status      ENUM('PENDING','RESOLVED') DEFAULT 'PENDING',
    resolved_by CHAR(36) NULL
                    COMMENT 'Agent ayant résolu l alerte',
    resolved_at TIMESTAMP NULL
                    COMMENT 'Horodatage de la résolution',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
                    COMMENT 'Tracking statut PENDING→RESOLVED',

    INDEX idx_alerts_bin (bin_id),
    INDEX idx_alerts_status (status),
    INDEX idx_alerts_severity (severity),

    CONSTRAINT fk_alerts_bin
        FOREIGN KEY (bin_id) REFERENCES bins(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_alerts_resolver
        FOREIGN KEY (resolved_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================================================
-- 6. NOTIFICATIONS — Canaux de diffusion (Email / Telegram)
-- =============================================================================
CREATE TABLE notifications (
    id          CHAR(36) PRIMARY KEY,
    alert_id    CHAR(36) NOT NULL,
    channel     ENUM('EMAIL','TELEGRAM') NOT NULL,
    recipient   VARCHAR(150) NULL,
    message     TEXT NULL,
    status      ENUM('PENDING','SENT','FAILED') DEFAULT 'PENDING',
    sent_at     TIMESTAMP NULL,

    INDEX idx_notifications_alert (alert_id),
    INDEX idx_notifications_status (status),
    INDEX idx_notifications_channel (channel),

    CONSTRAINT fk_notifications_alert
        FOREIGN KEY (alert_id) REFERENCES alerts(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 7. PREDICTIONS — Module IA / régression linéaire
-- =============================================================================
CREATE TABLE predictions (
    id                  CHAR(36) PRIMARY KEY,
    bin_id              CHAR(36) NOT NULL,
    predicted_fill_time DATETIME NULL
                            COMMENT 'Moment estimé du débordement',
    fill_probability    FLOAT DEFAULT 0
                            COMMENT 'Score de confiance R² (0-1)',
    risk_level          ENUM('LOW','MEDIUM','HIGH') DEFAULT 'LOW',
    recommendation      TEXT NULL
                            COMMENT 'Message suggérant une action',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_predictions_bin (bin_id),
    INDEX idx_predictions_risk (risk_level),
    INDEX idx_predictions_bin_created (bin_id, created_at),

    CONSTRAINT fk_predictions_bin
        FOREIGN KEY (bin_id) REFERENCES bins(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 8. REPORTS — Rapports opérationnels et stratégiques
-- =============================================================================
CREATE TABLE reports (
    id           CHAR(36) PRIMARY KEY,
    type         ENUM('OPERATIONAL','PERFORMANCE','STRATEGIC','ALERT') NOT NULL,
    period_start DATE NOT NULL,
    period_end   DATE NOT NULL,
    generated_by CHAR(36) NULL,
    file_path    VARCHAR(255) NULL,
    summary      TEXT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_reports_type (type),
    INDEX idx_reports_period (period_start, period_end),

    CONSTRAINT fk_reports_user
        FOREIGN KEY (generated_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================================================
-- 9. TABLES SYSTÈME (Laravel)
-- =============================================================================
-- Sessions utilisateur (authentification)
CREATE TABLE sessions (
    id            VARCHAR(255) PRIMARY KEY,
    user_id       CHAR(36) NULL,
    ip_address    VARCHAR(45) NULL,
    user_agent    TEXT NULL,
    payload       LONGTEXT NOT NULL,
    last_activity INT NOT NULL,

    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_last_activity (last_activity)
) ENGINE=InnoDB;

-- Reset de mot de passe
CREATE TABLE password_reset_tokens (
    email      VARCHAR(255) PRIMARY KEY,
    token      VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
) ENGINE=InnoDB;

-- Cache Laravel
CREATE TABLE cache (
    key        VARCHAR(255) PRIMARY KEY,
    value      MEDIUMTEXT NOT NULL,
    expiration INT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE cache_locks (
    key        VARCHAR(255) PRIMARY KEY,
    owner      VARCHAR(255) NOT NULL,
    expiration INT NOT NULL
) ENGINE=InnoDB;

-- File d attente des jobs
CREATE TABLE jobs (
    id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    queue        VARCHAR(255) NOT NULL,
    payload      LONGTEXT NOT NULL,
    attempts     TINYINT UNSIGNED NOT NULL,
    reserved_at  INT UNSIGNED NULL,
    available_at INT UNSIGNED NOT NULL,
    created_at   INT UNSIGNED NOT NULL,

    INDEX idx_jobs_queue (queue)
) ENGINE=InnoDB;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

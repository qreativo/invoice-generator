-- Lunara Invoice Management System - MySQL Schema
-- Database: lunara
-- Host: 107.175.179.122
-- User: lunara

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `password_reset_tokens`;

-- Create users table
CREATE TABLE `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'member') DEFAULT 'member',
  `is_active` BOOLEAN DEFAULT TRUE,
  `full_name` VARCHAR(100) NULL,
  `phone` VARCHAR(20) NULL,
  `avatar` TEXT NULL,
  `preferences` JSON NULL,
  `date_of_birth` DATE NULL,
  `address` TEXT NULL,
  `city` VARCHAR(50) NULL,
  `country` VARCHAR(50) NULL,
  `timezone` VARCHAR(50) NULL,
  `bio` TEXT NULL,
  `website` VARCHAR(255) NULL,
  `social_links` JSON NULL,
  `two_factor_enabled` BOOLEAN DEFAULT FALSE,
  `last_password_change` TIMESTAMP NULL,
  `email_verified` BOOLEAN DEFAULT FALSE,
  `whatsapp_verified` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL,
  
  -- Indexes for performance
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_email_verified` (`email_verified`),
  INDEX `idx_two_factor` (`two_factor_enabled`),
  INDEX `idx_city` (`city`),
  INDEX `idx_country` (`country`),
  
  -- Constraints
  CONSTRAINT `check_address_length` CHECK (LENGTH(`address`) <= 200),
  CONSTRAINT `check_bio_length` CHECK (LENGTH(`bio`) <= 500),
  CONSTRAINT `check_city_length` CHECK (LENGTH(`city`) <= 50),
  CONSTRAINT `check_country_length` CHECK (LENGTH(`country`) <= 50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create invoices table
CREATE TABLE `invoices` (
  `id` VARCHAR(36) PRIMARY KEY,
  `invoice_number` VARCHAR(50) UNIQUE NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `status` ENUM('draft', 'pending', 'paid', 'cancelled') DEFAULT 'draft',
  `invoice_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `status_updated_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Company Information
  `company_name` VARCHAR(255) NOT NULL,
  `company_address` TEXT NULL,
  `company_phone` VARCHAR(20) NULL,
  `company_email` VARCHAR(255) NULL,
  `company_website` VARCHAR(255) NULL,
  `company_logo` TEXT NULL,
  
  -- Client Information
  `client_name` VARCHAR(255) NOT NULL,
  `client_address` TEXT NULL,
  `client_phone` VARCHAR(20) NULL,
  `client_email` VARCHAR(255) NULL,
  
  -- Financial Information
  `currency` VARCHAR(3) DEFAULT 'USD',
  `subtotal` DECIMAL(15,2) DEFAULT 0.00,
  `tax_rate` DECIMAL(5,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) DEFAULT 0.00,
  `discount_rate` DECIMAL(5,2) DEFAULT 0.00,
  `discount_amount` DECIMAL(15,2) DEFAULT 0.00,
  `total_amount` DECIMAL(15,2) DEFAULT 0.00,
  
  -- Additional Information
  `notes` TEXT NULL,
  `terms` TEXT NULL,
  `language` ENUM('en', 'id') DEFAULT 'en',
  `theme` VARCHAR(50) DEFAULT 'modern',
  
  -- Foreign Keys
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_invoices_user_id` (`user_id`),
  INDEX `idx_invoices_status` (`status`),
  INDEX `idx_invoices_date` (`invoice_date`),
  
  -- Constraints
  CONSTRAINT `invoices_status_check` CHECK (`status` IN ('draft', 'pending', 'paid', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create invoice_items table
CREATE TABLE `invoice_items` (
  `id` VARCHAR(36) PRIMARY KEY,
  `invoice_id` VARCHAR(36) NOT NULL,
  `item_order` INT DEFAULT 0,
  `description` TEXT NOT NULL,
  `quantity` DECIMAL(10,2) DEFAULT 1.00,
  `unit_price` DECIMAL(15,2) DEFAULT 0.00,
  `total_amount` DECIMAL(15,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_invoice_items_invoice_id` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_sessions table
CREATE TABLE `user_sessions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_user_sessions_user_id` (`user_id`),
  INDEX `idx_user_sessions_token` (`token_hash`),
  INDEX `idx_user_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create system_settings table
CREATE TABLE `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(255) UNIQUE NOT NULL,
  `setting_value` TEXT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX `idx_system_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create password_reset_tokens table
CREATE TABLE `password_reset_tokens` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `token` VARCHAR(255) UNIQUE NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `method` ENUM('email', 'whatsapp') NOT NULL,
  `used` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_password_reset_tokens_user_id` (`user_id`),
  INDEX `idx_password_reset_tokens_token` (`token`),
  INDEX `idx_password_reset_tokens_expires_at` (`expires_at`),
  
  -- Constraints
  CONSTRAINT `password_reset_tokens_method_check` CHECK (`method` IN ('email', 'whatsapp'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create audit_logs table
CREATE TABLE `audit_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NULL,
  `action` VARCHAR(255) NOT NULL,
  `table_name` VARCHAR(255) NOT NULL,
  `record_id` VARCHAR(36) NULL,
  `old_values` JSON NULL,
  `new_values` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  
  -- Indexes
  INDEX `idx_audit_logs_user_id` (`user_id`),
  INDEX `idx_audit_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default users
INSERT INTO `users` (
  `id`, `username`, `email`, `password_hash`, `role`, `is_active`, 
  `full_name`, `phone`, `preferences`, `last_login`
) VALUES 
(
  'admin-001', 
  'admin', 
  'admin@lunara.com', 
  'admin123', 
  'admin', 
  TRUE, 
  'Administrator', 
  '+6281234567890',
  '{"language": "en", "theme": "modern", "currency": "USD", "notifications": {"email": true, "whatsapp": true}}',
  NOW()
),
(
  'admin-002', 
  'lunara', 
  'lunara@digilunar.com', 
  'lunara2025', 
  'admin', 
  TRUE, 
  'Lunara Admin', 
  '+6281234567891',
  '{"language": "en", "theme": "modern", "currency": "IDR", "notifications": {"email": true, "whatsapp": true}}',
  NOW()
),
(
  'user-001', 
  'demo', 
  'demo@lunara.com', 
  'demo123', 
  'member', 
  TRUE, 
  'Demo User', 
  '+6281234567892',
  '{"language": "id", "theme": "classic", "currency": "IDR", "notifications": {"email": true, "whatsapp": false}}',
  NOW()
);

-- Insert system settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('app_name', 'Lunara Invoice Management', 'Application name'),
('app_version', '1.0.0', 'Application version'),
('default_currency', 'USD', 'Default currency for new invoices'),
('default_language', 'en', 'Default language for new users'),
('default_theme', 'modern', 'Default theme for new users'),
('smtp_enabled', 'false', 'Enable SMTP email sending'),
('whatsapp_enabled', 'false', 'Enable WhatsApp notifications');

-- Create triggers for updated_at timestamps
DELIMITER $$

CREATE TRIGGER `update_users_updated_at` 
BEFORE UPDATE ON `users` 
FOR EACH ROW 
BEGIN 
  SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

CREATE TRIGGER `update_invoices_updated_at` 
BEFORE UPDATE ON `invoices` 
FOR EACH ROW 
BEGIN 
  SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

CREATE TRIGGER `update_invoice_items_updated_at` 
BEFORE UPDATE ON `invoice_items` 
FOR EACH ROW 
BEGIN 
  SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

CREATE TRIGGER `update_system_settings_updated_at` 
BEFORE UPDATE ON `system_settings` 
FOR EACH ROW 
BEGIN 
  SET NEW.updated_at = CURRENT_TIMESTAMP; 
END$$

DELIMITER ;

-- Show created tables
SHOW TABLES;

-- Show user count
SELECT COUNT(*) as user_count FROM users;

-- Show default users
SELECT id, username, email, role, is_active, full_name FROM users;
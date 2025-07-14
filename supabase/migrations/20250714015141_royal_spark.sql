-- Lunara Invoice Management System Database Schema
-- MySQL Database Setup

-- Create database
CREATE DATABASE IF NOT EXISTS lunara_invoices 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE lunara_invoices;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- User sessions table
CREATE TABLE user_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token_hash),
    INDEX idx_expires (expires_at)
);

-- Invoices table
CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    status ENUM('draft', 'pending', 'paid', 'cancelled') DEFAULT 'draft',
    
    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status_updated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    company_logo LONGTEXT, -- Base64 encoded logo
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    client_address TEXT,
    client_phone VARCHAR(50),
    client_email VARCHAR(255),
    
    -- Financial Information
    currency VARCHAR(3) DEFAULT 'USD',
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    discount_rate DECIMAL(5,2) DEFAULT 0.00,
    discount_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Additional Information
    notes TEXT,
    terms TEXT,
    language VARCHAR(2) DEFAULT 'en',
    theme VARCHAR(50) DEFAULT 'modern',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_status (status),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_due_date (due_date),
    INDEX idx_client_name (client_name),
    INDEX idx_total_amount (total_amount)
);

-- Invoice items table
CREATE TABLE invoice_items (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    invoice_id VARCHAR(36) NOT NULL,
    item_order INT NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_item_order (item_order)
);

-- System settings table
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key)
);

-- Audit log table
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(36),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_record_id (record_id),
    INDEX idx_created_at (created_at)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, username, email, password_hash, role, is_active) VALUES 
('admin-001', 'admin', 'admin@lunara.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', 'admin', TRUE),
('user-001', 'user', 'user@lunara.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', 'member', TRUE);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('app_name', 'Lunara Invoice Management', 'Application name'),
('app_version', '1.0.0', 'Application version'),
('default_currency', 'USD', 'Default currency for new invoices'),
('default_language', 'en', 'Default language for new users'),
('default_theme', 'modern', 'Default theme for new invoices'),
('google_auth_enabled', 'false', 'Enable Google OAuth authentication'),
('google_client_id', '', 'Google OAuth Client ID'),
('google_client_secret', '', 'Google OAuth Client Secret'),
('turnstile_site_key', '0x4AAAAAABk-oQfMyjJDTVZT', 'Cloudflare Turnstile Site Key'),
('turnstile_secret_key', '0x4AAAAAABk-oecjI8kuCX-L2BwDbX59Ka4', 'Cloudflare Turnstile Secret Key');

-- Create views for reporting
CREATE VIEW invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.status,
    i.invoice_date,
    i.due_date,
    i.client_name,
    i.total_amount,
    i.currency,
    u.username as created_by,
    COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN users u ON i.user_id = u.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id;

CREATE VIEW user_invoice_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(i.id) as total_invoices,
    SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN i.status = 'pending' THEN i.total_amount ELSE 0 END) as total_pending,
    SUM(i.total_amount) as total_amount
FROM users u
LEFT JOIN invoices i ON u.id = i.user_id
GROUP BY u.id;

-- Create stored procedures
DELIMITER //

CREATE PROCEDURE GetInvoiceWithItems(IN invoice_id VARCHAR(36))
BEGIN
    SELECT * FROM invoices WHERE id = invoice_id;
    SELECT * FROM invoice_items WHERE invoice_id = invoice_id ORDER BY item_order;
END //

CREATE PROCEDURE UpdateInvoiceStatus(
    IN invoice_id VARCHAR(36), 
    IN new_status VARCHAR(20),
    IN user_id VARCHAR(36)
)
BEGIN
    DECLARE old_status VARCHAR(20);
    
    SELECT status INTO old_status FROM invoices WHERE id = invoice_id;
    
    UPDATE invoices 
    SET status = new_status, 
        status_updated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = invoice_id;
    
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (user_id, 'UPDATE_STATUS', 'invoices', invoice_id, 
            JSON_OBJECT('status', old_status),
            JSON_OBJECT('status', new_status));
END //

DELIMITER ;

-- Create triggers for audit logging
DELIMITER //

CREATE TRIGGER invoice_audit_insert 
AFTER INSERT ON invoices
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.user_id, 'INSERT', 'invoices', NEW.id, 
            JSON_OBJECT('invoice_number', NEW.invoice_number, 'status', NEW.status));
END //

CREATE TRIGGER invoice_audit_update 
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (NEW.user_id, 'UPDATE', 'invoices', NEW.id,
            JSON_OBJECT('status', OLD.status, 'total_amount', OLD.total_amount),
            JSON_OBJECT('status', NEW.status, 'total_amount', NEW.total_amount));
END //

CREATE TRIGGER invoice_audit_delete 
BEFORE DELETE ON invoices
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (OLD.user_id, 'DELETE', 'invoices', OLD.id,
            JSON_OBJECT('invoice_number', OLD.invoice_number, 'status', OLD.status));
END //

DELIMITER ;
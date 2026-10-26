CREATE TABLE IF NOT EXISTS inquiries (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 customer_uid VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 request_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 merchant_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 product_id VARCHAR(40) NOT NULL,
 subject VARCHAR(120) NOT NULL,
 body TEXT NOT NULL,
 category VARCHAR(24) NOT NULL,
 status ENUM('open','in_progress','waiting_customer','resolved','closed') NOT NULL DEFAULT 'open',
 assignee_uid VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
 draft TEXT NULL,
 draft_source VARCHAR(24) NULL,
 approved_by VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
 approved_at DATETIME(3) NULL,
 version INT NOT NULL DEFAULT 1,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 UNIQUE KEY inquiry_request(customer_uid,request_id),
 INDEX inquiry_customer(customer_uid,updated_at),
 INDEX inquiry_store(merchant_id,status,updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS inquiry_replies (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 inquiry_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 body TEXT NOT NULL,
 approved_by VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 published_by VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 published_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT inquiry_reply_parent FOREIGN KEY(inquiry_id) REFERENCES inquiries(id),
 INDEX inquiry_reply_list(inquiry_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE IF NOT EXISTS inquiry_audit (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 inquiry_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 actor_uid VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
 action VARCHAR(30) NOT NULL,
 version INT NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT inquiry_audit_parent FOREIGN KEY(inquiry_id) REFERENCES inquiries(id),
 INDEX inquiry_audit_list(inquiry_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

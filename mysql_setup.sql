CREATE DATABASE IF NOT EXISTS sellgram;
USE sellgram;

CREATE TABLE sellers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    fib_account VARCHAR(255),
    telegram_id BIGINT
);

CREATE TABLE products (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT,
    name      VARCHAR(255) NOT NULL,
    price     INT NOT NULL,
    type      VARCHAR(50) DEFAULT 'digital',
    file_path VARCHAR(500),
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(255) UNIQUE,
    user_id    BIGINT NOT NULL,
    product_id INT,
    status     VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Test data (replace 123456789 with your Telegram ID)
INSERT INTO sellers (name, telegram_id) VALUES ('Test Seller', 123456789);

INSERT INTO products (seller_id, name, price, type, file_path)
VALUES (1, 'كورس Python', 25000, 'digital', 'https://t.me/+your_invite_link');

INSERT INTO orders (payment_id, user_id, product_id, status)
VALUES ('test_payment_123', 123456789, 1, 'pending');
CREATE TABLE IF NOT EXISTS signup_requests (
    emp_id      VARCHAR(100) PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    designation VARCHAR(255),
    skills      TEXT,
    status      VARCHAR(20) DEFAULT 'PENDING'
);

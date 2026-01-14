-- ============================================
-- ORACLE SCHEMA FOR YARSU BACKEND
-- Migrated from PostgreSQL/Supabase
-- ============================================

-- NOTE: Run these scripts in order. Sequences first, then tables.

-- ============================================
-- SEQUENCES (for auto-increment IDs)
-- ============================================

CREATE SEQUENCE condos_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE courses_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE docs_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE general_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE highlights_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE hotels_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE jobs_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE links_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE restaurants_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE travel_posts_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE user_inquiries_seq START WITH 1 INCREMENT BY 1;

-- ============================================
-- USERS TABLE (main users table)
-- ============================================
CREATE TABLE users (
  id VARCHAR2(36) PRIMARY KEY,  -- UUID stored as string
  email VARCHAR2(255) NOT NULL UNIQUE,
  password_hash VARCHAR2(255),  -- For local auth (bcrypt hash)
  role VARCHAR2(50) DEFAULT 'member' NOT NULL,
  name VARCHAR2(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- REFRESH TOKENS (for JWT refresh token storage)
-- ============================================
CREATE TABLE refresh_tokens (
  id VARCHAR2(36) PRIMARY KEY,
  user_id VARCHAR2(36) NOT NULL,
  token VARCHAR2(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================
-- JOBS TABLE
-- ============================================
CREATE TABLE jobs (
  id NUMBER PRIMARY KEY,
  title VARCHAR2(500) NOT NULL,
  pinkcard NUMBER(1) DEFAULT 0 NOT NULL,  -- Boolean: 0=false, 1=true
  thai NUMBER(1) DEFAULT 0 NOT NULL,
  payment_type NUMBER(1),  -- Nullable boolean
  stay NUMBER(1) DEFAULT 0 NOT NULL,
  location VARCHAR2(500),
  job_location VARCHAR2(500) NOT NULL,
  notes VARCHAR2(2000),
  job_num VARCHAR2(100),
  media CLOB,  -- JSON array stored as CLOB
  job_date VARCHAR2(500),
  payment VARCHAR2(500),
  pay_amount VARCHAR2(200),
  accept_amount VARCHAR2(200),
  accept VARCHAR2(500),
  treat NUMBER(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER jobs_bi
BEFORE INSERT ON jobs
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT jobs_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- USER INQUIRIES TABLE
-- ============================================
CREATE TABLE user_inquiries (
  id NUMBER PRIMARY KEY,
  job_id NUMBER,
  user_id VARCHAR2(36),
  name VARCHAR2(255) NOT NULL,
  phonenumber VARCHAR2(50) NOT NULL,
  address VARCHAR2(1000) NOT NULL,
  birthday DATE NOT NULL,
  thailanguage NUMBER(1) NOT NULL,  -- Boolean
  gender NUMBER(1) NOT NULL,  -- Boolean
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inquiries_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_inquiries_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_inquiries_job ON user_inquiries(job_id);
CREATE INDEX idx_inquiries_user ON user_inquiries(user_id);

CREATE OR REPLACE TRIGGER user_inquiries_bi
BEFORE INSERT ON user_inquiries
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT user_inquiries_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- CONDOS TABLE
-- ============================================
CREATE TABLE condos (
  id NUMBER PRIMARY KEY,
  name VARCHAR2(500) NOT NULL,
  address VARCHAR2(1000) NOT NULL,
  rent_fee NUMBER(10,2) NOT NULL,
  images CLOB NOT NULL,  -- JSON array
  swimming_pool NUMBER(1) DEFAULT 0 NOT NULL,
  free_wifi NUMBER(1) DEFAULT 0 NOT NULL,
  gym NUMBER(1) DEFAULT 0 NOT NULL,
  garden NUMBER(1) DEFAULT 0 NOT NULL,
  co_working_space NUMBER(1) DEFAULT 0 NOT NULL,
  notes CLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER condos_bi
BEFORE INSERT ON condos
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT condos_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- COURSES TABLE
-- ============================================
CREATE TABLE courses (
  id NUMBER PRIMARY KEY,
  name VARCHAR2(500) NOT NULL,
  duration VARCHAR2(200) NOT NULL,
  price NUMBER(10,2) NOT NULL,
  centre_name VARCHAR2(500) NOT NULL,
  location VARCHAR2(500) NOT NULL,
  notes CLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER courses_bi
BEFORE INSERT ON courses
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT courses_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- DOCS TABLE
-- ============================================
CREATE TABLE docs (
  id NUMBER PRIMARY KEY,
  text CLOB NOT NULL,
  media CLOB DEFAULT '[]',  -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER docs_bi
BEFORE INSERT ON docs
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT docs_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- GENERAL TABLE
-- ============================================
CREATE TABLE general (
  id NUMBER PRIMARY KEY,
  text CLOB NOT NULL,
  media CLOB DEFAULT '[]',  -- JSON array
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER general_bi
BEFORE INSERT ON general
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT general_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- HIGHLIGHTS TABLE
-- ============================================
CREATE TABLE highlights (
  id NUMBER PRIMARY KEY,
  image VARCHAR2(1000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER highlights_bi
BEFORE INSERT ON highlights
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT highlights_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- HOTELS TABLE
-- ============================================
CREATE TABLE hotels (
  id NUMBER PRIMARY KEY,
  name VARCHAR2(500) NOT NULL,
  address VARCHAR2(1000) NOT NULL,
  price NUMBER(10,2) NOT NULL,
  nearby_famous_places CLOB NOT NULL,  -- JSON array
  breakfast NUMBER(1) DEFAULT 0 NOT NULL,
  free_wifi NUMBER(1) DEFAULT 0 NOT NULL,
  swimming_pool NUMBER(1) DEFAULT 0 NOT NULL,
  images CLOB NOT NULL,  -- JSON array
  notes VARCHAR2(2000),
  admin_rating NUMBER(1) NOT NULL CHECK (admin_rating >= 1 AND admin_rating <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER hotels_bi
BEFORE INSERT ON hotels
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT hotels_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- LINKS TABLE
-- ============================================
CREATE TABLE links (
  id NUMBER PRIMARY KEY,
  platform VARCHAR2(200) NOT NULL,
  url VARCHAR2(2000) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER links_bi
BEFORE INSERT ON links
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT links_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- RESTAURANTS TABLE
-- ============================================
CREATE TABLE restaurants (
  id NUMBER PRIMARY KEY,
  name VARCHAR2(500) NOT NULL,
  location VARCHAR2(500) NOT NULL,
  images CLOB NOT NULL,  -- JSON array
  popular_picks CLOB NOT NULL,  -- JSON array
  admin_rating NUMBER(1) NOT NULL CHECK (admin_rating >= 1 AND admin_rating <= 5),
  notes VARCHAR2(2000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER restaurants_bi
BEFORE INSERT ON restaurants
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT restaurants_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- TRAVEL POSTS TABLE
-- ============================================
CREATE TABLE travel_posts (
  id NUMBER PRIMARY KEY,
  name VARCHAR2(500) NOT NULL,
  place VARCHAR2(500) NOT NULL,
  highlights CLOB NOT NULL,  -- JSON array
  images CLOB NOT NULL,  -- JSON array
  admin_rating NUMBER(1) NOT NULL CHECK (admin_rating >= 1 AND admin_rating <= 5),
  notes CLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER travel_posts_bi
BEFORE INSERT ON travel_posts
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT travel_posts_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ============================================
-- NOTI PUSH TOKENS TABLE
-- ============================================
CREATE TABLE noti_push_tokens (
  id VARCHAR2(36) PRIMARY KEY,
  user_id VARCHAR2(36) NOT NULL,
  token VARCHAR2(500) NOT NULL,
  device_id VARCHAR2(255),
  platform VARCHAR2(50),
  provider VARCHAR2(50) DEFAULT 'fcm' NOT NULL,
  enabled NUMBER(1) DEFAULT 1 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_push_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_push_tokens_user ON noti_push_tokens(user_id);

-- ============================================
-- HELPFUL COMMENTS
-- ============================================
-- 
-- DIFFERENCES FROM POSTGRESQL:
-- 1. Boolean fields use NUMBER(1) with 0/1 instead of BOOLEAN
-- 2. Arrays are stored as CLOB containing JSON (use JSON_TABLE to query)
-- 3. UUID is stored as VARCHAR2(36)
-- 4. TEXT/VARCHAR types use VARCHAR2 (max 4000) or CLOB for longer text
-- 5. SERIAL/IDENTITY columns use SEQUENCE + TRIGGER
-- 6. TIMESTAMP works similarly but syntax differs for intervals
--
-- TO QUERY JSON ARRAYS IN ORACLE:
-- SELECT j.* 
-- FROM jobs j, JSON_TABLE(j.media, '$[*]' COLUMNS (url PATH '$')) jt
-- WHERE jt.url LIKE '%example%';

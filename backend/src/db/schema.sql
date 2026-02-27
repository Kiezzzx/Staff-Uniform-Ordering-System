PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS role_allowance_limits (
  id INTEGER PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  annual_limit INTEGER NOT NULL CHECK (annual_limit >= 0)
);

CREATE TABLE IF NOT EXISTS role_cooldown_limits (
  id INTEGER PRIMARY KEY,
  role_name TEXT NOT NULL UNIQUE,
  cooldown_days INTEGER NOT NULL CHECK (cooldown_days >= 0)
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  store_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  UNIQUE (name, store_id),
  FOREIGN KEY (store_id) REFERENCES stores(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS uniform_items (
  id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL,
  size TEXT NOT NULL,
  item_name TEXT NOT NULL,
  stock_on_hand INTEGER NOT NULL CHECK (stock_on_hand >= 0),
  UNIQUE (sku, size)
);

CREATE TABLE IF NOT EXISTS uniform_requests (
  id INTEGER PRIMARY KEY,
  staff_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('REQUESTED', 'DISPATCHED', 'ARRIVED', 'COLLECTED')),
  reorder_reason TEXT,
  requested_at DATETIME NOT NULL,
  dispatched_at DATETIME,
  arrived_at DATETIME,
  collected_at DATETIME,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS uniform_request_items (
  id INTEGER PRIMARY KEY,
  request_id INTEGER NOT NULL,
  uniform_item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (request_id, uniform_item_id),
  FOREIGN KEY (request_id) REFERENCES uniform_requests(id),
  FOREIGN KEY (uniform_item_id) REFERENCES uniform_items(id)
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id INTEGER PRIMARY KEY,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS import_row_errors (
  id INTEGER PRIMARY KEY,
  import_job_id INTEGER NOT NULL,
  row_number INTEGER NOT NULL,
  error_message TEXT NOT NULL,
  FOREIGN KEY (import_job_id) REFERENCES import_jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_staff_store ON staff(store_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role_id);
CREATE INDEX IF NOT EXISTS idx_req_staff ON uniform_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_req_status ON uniform_requests(status);

INSERT OR IGNORE INTO role_allowance_limits (role_name, annual_limit) VALUES
  ('MANAGER', 5),
  ('CASUAL', 2);

INSERT OR IGNORE INTO role_cooldown_limits (role_name, cooldown_days) VALUES
  ('MANAGER', 30),
  ('CASUAL', 30);

INSERT OR IGNORE INTO system_settings (key, value)
VALUES ('COOLDOWN_DAYS', '30');

-- Run this in pgAdmin's Query Tool on your timesheet_db to add the new columns
-- without losing any existing data.

ALTER TABLE departments ADD COLUMN IF NOT EXISTS code VARCHAR UNIQUE;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name VARCHAR;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;

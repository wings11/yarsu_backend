
-- Migration: create noti_push_tokens table
-- Assumptions:
-- 1) Supabase/Postgres allows installing the "pgcrypto" extension for gen_random_uuid().
-- 2) Auth user ids are UUIDs; user_id is stored as uuid. If your project uses integers, adjust accordingly.

BEGIN;

-- enable pgcrypto for gen_random_uuid(); if not allowed, replace DEFAULT gen_random_uuid() with uuid_generate_v4() or remove default
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.noti_push_tokens (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	token text NOT NULL,
	device_id text,
	platform text,
	provider text NOT NULL DEFAULT 'fcm',
	enabled boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

-- index for lookups by user
CREATE INDEX IF NOT EXISTS noti_push_tokens_user_id_idx ON public.noti_push_tokens (user_id);

-- ensure tokens are unique so ON CONFLICT(token) works with upsert
CREATE UNIQUE INDEX IF NOT EXISTS noti_push_tokens_token_uq ON public.noti_push_tokens (token);

-- helper to keep updated_at current
CREATE OR REPLACE FUNCTION public.noti_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_noti_update_timestamp ON public.noti_push_tokens;
CREATE TRIGGER trg_noti_update_timestamp
	BEFORE UPDATE ON public.noti_push_tokens
	FOR EACH ROW
	EXECUTE FUNCTION public.noti_update_timestamp();

COMMIT;

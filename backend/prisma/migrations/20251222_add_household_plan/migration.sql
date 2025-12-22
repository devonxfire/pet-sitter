-- Add 'plan' column to households, default to 'free'
ALTER TABLE "households" ADD COLUMN "plan" VARCHAR(20) NOT NULL DEFAULT 'free';

-- Optional: update existing rows explicitly (redundant because of DEFAULT)
UPDATE "households" SET "plan" = 'free' WHERE "plan" IS NULL;

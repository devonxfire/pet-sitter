BEGIN;

-- Rename table
ALTER TABLE IF EXISTS "quick_actions" RENAME TO "favourites";

-- Rename primary key constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'quick_actions_pkey') THEN
    ALTER TABLE "favourites" RENAME CONSTRAINT "quick_actions_pkey" TO "favourites_pkey";
  END IF;
END$$;

-- Rename index
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'quick_actions_household_id_ord_idx') THEN
    ALTER INDEX "quick_actions_household_id_ord_idx" RENAME TO "favourites_household_id_ord_idx";
  END IF;
END$$;

-- Rename foreign key constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'quick_actions_household_id_fkey') THEN
    ALTER TABLE "favourites" RENAME CONSTRAINT "quick_actions_household_id_fkey" TO "favourites_household_id_fkey";
  END IF;
END$$;

-- Rename sequence if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'quick_actions_id_seq') THEN
    ALTER SEQUENCE "quick_actions_id_seq" RENAME TO "favourites_id_seq";
    -- Reassign ownership
    ALTER SEQUENCE "favourites_id_seq" OWNED BY "favourites"."id";
  END IF;
END$$;

COMMIT;

# Loom — Backend Data Dictionary

Technical specification for the Loom application database. The schema supports a two-stage hybrid matching workflow:

- **Stage 1 — Relational Filtering:** Hard SQL predicates on `profiles` and `match_preferences` drop ineligible candidates (gender target, campus lock, verification, pause state, blacklist).
- **Stage 2 — Vector Similarity:** Surviving candidates are ranked by database-level cosine distance over `prompt_responses.embedding` using a `pgvector` HNSW index.

---

## 1. Production DDL Schema (PostgreSQL)

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- =========================================================
-- profiles — identity + Stage 1 filter attributes
-- =========================================================
CREATE TABLE public.profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name        VARCHAR(80),
    gender              VARCHAR(20),
    campus_hub          VARCHAR(120),
    target_preference   VARCHAR(20),
    edu_verified        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- matching_preferences — Stage 1 per-user filter toggles
-- =========================================================
CREATE TABLE public.matching_preferences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    campus_lock     BOOLEAN     NOT NULL DEFAULT TRUE,
    pause_matching  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================
-- prompt_responses — Stage 2 semantic embeddings
-- =========================================================
CREATE TABLE public.prompt_responses (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    response_text   TEXT NOT NULL,
    embedding       vector(384),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX prompt_responses_embedding_hnsw
    ON public.prompt_responses
    USING hnsw (embedding vector_cosine_ops);

-- =========================================================
-- match_history — blacklist of prior separations
-- =========================================================
CREATE TABLE public.match_history (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    separation_category  VARCHAR(40) NOT NULL,
    open_feedback        TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants (Supabase Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matching_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_responses     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_history        TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE prompt_responses_id_seq             TO authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Row-Level Security
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history        ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY mp_rw_own ON public.matching_preferences
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY pr_rw_own ON public.prompt_responses
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY mh_rw_own ON public.match_history
    FOR ALL TO authenticated
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 2. Data Dictionary

### 2.1 `profiles`

Identity record and Stage 1 hard-filter attributes.

| Field             | Data Type     | Constraints                              | Description / Business Logic                                                                                              |
| ----------------- | ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `id`              | UUID          | PK, FK → `auth.users(id)`, NOT NULL      | Mirrors the authenticated user ID. Join key for every downstream table.                                                   |
| `display_name`    | VARCHAR(80)   | NULL                                     | User-visible handle. Display-only; never used as a filter.                                                                |
| `gender`          | VARCHAR(20)   | NULL                                     | Self-identified gender. **Stage 1:** compared against the counterpart's `target_preference` to drop incompatible rows.    |
| `campus_hub`      | VARCHAR(120)  | NULL                                     | Campus / institution slug. **Stage 1:** when `matching_preferences.campus_lock = TRUE`, candidates with a different `campus_hub` are dropped. |
| `target_preference` | VARCHAR(20) | NULL                                     | Gender the user wants to match with. **Stage 1:** compared against the candidate's `gender`.                              |
| `edu_verified`    | BOOLEAN       | NOT NULL, DEFAULT FALSE                  | Denormalized verification flag. **Stage 1:** enables fast `WHERE edu_verified = TRUE` filtering without joining `auth.users`. |
| `created_at`      | TIMESTAMPTZ   | NOT NULL, DEFAULT `now()`                | Row creation timestamp.                                                                                                   |
| `updated_at`      | TIMESTAMPTZ   | NOT NULL, DEFAULT `now()`                | Last modification timestamp.                                                                                              |

### 2.2 `matching_preferences`

Per-user toggles applied as predicates during Stage 1.

| Field            | Data Type   | Constraints                                       | Description / Business Logic                                                                                       |
| ---------------- | ----------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`             | UUID        | PK, DEFAULT `gen_random_uuid()`                   | Surrogate primary key.                                                                                             |
| `user_id`        | UUID        | UNIQUE, NOT NULL, FK → `auth.users(id)`           | Owning user. UNIQUE enforces one preference row per user.                                                          |
| `campus_lock`    | BOOLEAN     | NOT NULL, DEFAULT TRUE                            | **Stage 1:** when TRUE, the candidate pool is restricted to the user's `profiles.campus_hub`.                      |
| `pause_matching` | BOOLEAN     | NOT NULL, DEFAULT FALSE                           | **Stage 1:** when TRUE, the user is excluded from every candidate pool and skipped by the daily matcher.           |
| `created_at`     | TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                         | Row creation timestamp.                                                                                            |
| `updated_at`     | TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                         | Last modification timestamp.                                                                                       |

### 2.3 `prompt_responses`

Free-text answers and their semantic embeddings — the substrate for Stage 2.

| Field           | Data Type     | Constraints                              | Description / Business Logic                                                                                                                |
| --------------- | ------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | BIGSERIAL     | PK                                       | Monotonic surrogate key.                                                                                                                    |
| `user_id`       | UUID          | NOT NULL, FK → `auth.users(id)`          | Owning user. Group key for aggregating a user's embeddings.                                                                                 |
| `response_text` | TEXT          | NOT NULL                                 | Raw prompt answer. Source text for embedding generation; not used in Stage 1.                                                               |
| `embedding`     | vector(384)   | NULL                                     | 384-dim sentence embedding (Gemma / MiniLM class). **Stage 2:** ranked by `1 - (a.embedding <=> b.embedding)` (cosine similarity) via HNSW. |
| `created_at`    | TIMESTAMPTZ   | NOT NULL, DEFAULT `now()`                | Row creation timestamp.                                                                                                                     |

### 2.4 `match_history`

Outcome log used as a Stage 1 blacklist to prevent re-pairing.

| Field                 | Data Type   | Constraints                              | Description / Business Logic                                                                                       |
| --------------------- | ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`                  | UUID        | PK, DEFAULT `gen_random_uuid()`          | Surrogate primary key.                                                                                             |
| `user_id`             | UUID        | NOT NULL, FK → `auth.users(id)`          | Owning user.                                                                                                       |
| `separation_category` | VARCHAR(40) | NOT NULL                                 | Enumerated reason (e.g. `mutual_end`, `reported`, `ghosted`). **Stage 1:** prior counterparts are excluded.        |
| `open_feedback`       | TEXT        | NULL                                     | Optional free-text feedback. Informational only — does not feed the matcher.                                       |
| `created_at`          | TIMESTAMPTZ | NOT NULL, DEFAULT `now()`                | Row creation timestamp.                                                                                            |

---

## 3. Two-Stage Matching Workflow Reference

```text
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1 — Relational Filtering (SQL WHERE)                     │
│   - profiles.gender           ⇄ counterpart.target_preference  │
│   - profiles.target_preference ⇄ counterpart.gender            │
│   - profiles.campus_hub        = me.campus_hub  (if campus_lock)│
│   - profiles.edu_verified      = TRUE          (if required)    │
│   - matching_preferences.pause_matching = FALSE                 │
│   - NOT EXISTS (match_history blacklist)                        │
└─────────────────────────────────────────────────────────────────┘
                              │ surviving candidate UUIDs
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Stage 2 — Vector Similarity (pgvector / HNSW)                  │
│   ORDER BY (me.embedding <=> candidate.embedding) ASC          │
│   LIMIT k                                                       │
└─────────────────────────────────────────────────────────────────┘
```

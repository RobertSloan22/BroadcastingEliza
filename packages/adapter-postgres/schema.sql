-- Enable pgvector extension

-- -- Drop existing tables and extensions
-- DROP EXTENSION IF EXISTS vector CASCADE;
-- DROP TABLE IF EXISTS relationships CASCADE;
-- DROP TABLE IF EXISTS participants CASCADE;
-- DROP TABLE IF EXISTS logs CASCADE;
-- DROP TABLE IF EXISTS goals CASCADE;
-- DROP TABLE IF EXISTS memories CASCADE;
-- DROP TABLE IF EXISTS rooms CASCADE;
-- DROP TABLE IF EXISTS accounts CASCADE;


CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Create a function to determine vector dimension
CREATE OR REPLACE FUNCTION get_embedding_dimension()
RETURNS INTEGER AS $$
BEGIN
    -- Check for OpenAI first
    IF current_setting('app.use_openai_embedding', TRUE) = 'true' THEN
        RETURN 1536;  -- OpenAI dimension
    -- Then check for Ollama
    ELSIF current_setting('app.use_ollama_embedding', TRUE) = 'true' THEN
        RETURN 1024;  -- Ollama mxbai-embed-large dimension
    ELSE
        RETURN 384;   -- BGE/Other embedding dimension
    END IF;
END;
$$ LANGUAGE plpgsql;

BEGIN;

CREATE TABLE IF NOT EXISTS accounts (
    "id" UUID PRIMARY KEY,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "details" JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS rooms (
    "id" UUID PRIMARY KEY,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DO $$
DECLARE
    vector_dim INTEGER;
BEGIN
    vector_dim := get_embedding_dimension();

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS memories (
            "id" UUID PRIMARY KEY,
            "type" TEXT NOT NULL,
            "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            "content" JSONB NOT NULL,
            "embedding" vector(%s),
            "userId" UUID REFERENCES accounts("id"),
            "agentId" UUID REFERENCES accounts("id"),
            "roomId" UUID REFERENCES rooms("id"),
            "unique" BOOLEAN DEFAULT true NOT NULL,
            CONSTRAINT fk_room FOREIGN KEY ("roomId") REFERENCES rooms("id") ON DELETE CASCADE,
            CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES accounts("id") ON DELETE CASCADE,
            CONSTRAINT fk_agent FOREIGN KEY ("agentId") REFERENCES accounts("id") ON DELETE CASCADE
        )', vector_dim);
END $$;

CREATE TABLE IF NOT EXISTS  goals (
    "id" UUID PRIMARY KEY,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID REFERENCES accounts("id"),
    "name" TEXT,
    "status" TEXT,
    "description" TEXT,
    "roomId" UUID REFERENCES rooms("id"),
    "objectives" JSONB DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT fk_room FOREIGN KEY ("roomId") REFERENCES rooms("id") ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES accounts("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  logs (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL REFERENCES accounts("id"),
    "body" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "roomId" UUID NOT NULL REFERENCES rooms("id"),
    CONSTRAINT fk_room FOREIGN KEY ("roomId") REFERENCES rooms("id") ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES accounts("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  participants (
    "id" UUID PRIMARY KEY,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID REFERENCES accounts("id"),
    "roomId" UUID REFERENCES rooms("id"),
    "userState" TEXT,
    "last_message_read" TEXT,
    UNIQUE("userId", "roomId"),
    CONSTRAINT fk_room FOREIGN KEY ("roomId") REFERENCES rooms("id") ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES accounts("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  relationships (
    "id" UUID PRIMARY KEY,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "userA" UUID NOT NULL REFERENCES accounts("id"),
    "userB" UUID NOT NULL REFERENCES accounts("id"),
    "status" TEXT,
    "userId" UUID NOT NULL REFERENCES accounts("id"),
    CONSTRAINT fk_user_a FOREIGN KEY ("userA") REFERENCES accounts("id") ON DELETE CASCADE,
    CONSTRAINT fk_user_b FOREIGN KEY ("userB") REFERENCES accounts("id") ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES accounts("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  cache (
    "key" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "value" JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP,
    PRIMARY KEY ("key", "agentId")
);

CREATE TABLE IF NOT EXISTS broadcasts (
    "id" UUID PRIMARY KEY,
    "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "broadcast_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_username" TEXT NOT NULL,
    "buy_token_id" TEXT,
    "buy_token_amount" NUMERIC,
    "buy_token_price" NUMERIC,
    "buy_token_mcap" NUMERIC,
    "sell_token_id" TEXT,
    "sell_token_amount" NUMERIC,
    "sell_token_price" NUMERIC,
    "sell_token_mcap" NUMERIC,
    "buy_token_name" TEXT,
    "buy_token_symbol" TEXT,
    "buy_token_chain" TEXT,
    "buy_token_liquidity" NUMERIC,
    "buy_token_volume24h" NUMERIC,
    "buy_token_verified" BOOLEAN,
    "user_is_verified" BOOLEAN,
    "user_follower_count" INTEGER,
    "raw_data" JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_memories_type_room ON memories("type", "roomId");
CREATE INDEX IF NOT EXISTS idx_participants_user ON participants("userId");
CREATE INDEX IF NOT EXISTS idx_participants_room ON participants("roomId");
CREATE INDEX IF NOT EXISTS idx_relationships_users ON relationships("userA", "userB");
CREATE INDEX idx_broadcasts_created_at ON broadcasts("createdAt" DESC);
CREATE INDEX idx_broadcasts_user_username ON broadcasts("user_username");
CREATE INDEX idx_broadcasts_buy_token_id ON broadcasts("buy_token_id");

COMMIT;

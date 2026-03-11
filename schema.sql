-- ═══════════════════════════════════════════════════════════
-- ARIA Chatbot — Database Schema
-- Generated: 2026-03-11
-- Engine: SQLite
-- ═══════════════════════════════════════════════════════════

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─── Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,               -- bcrypt hash
    created_at  TEXT    DEFAULT (datetime('now')),
    last_login  TEXT
);

-- ─── Conversations ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    title       TEXT,
    created_at  TEXT    DEFAULT (datetime('now')),
    updated_at  TEXT    DEFAULT (datetime('now')),
    session_id  TEXT    UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conversations_user
    ON conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_session
    ON conversations(session_id);

-- ─── Messages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role            TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
    content         TEXT    NOT NULL,
    intent          TEXT,
    confidence      REAL    DEFAULT 0.0,
    source          TEXT    CHECK (source IN ('rasa', 'llm', NULL)),
    tokens          INTEGER DEFAULT 0,
    created_at      TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id);

-- ─── Roadmaps ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roadmaps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    roadmap_id      TEXT    UNIQUE,
    topic           TEXT,
    roadmap_data    TEXT,                       -- JSON blob
    completed_items TEXT    DEFAULT '[]',       -- JSON array
    total_items     INTEGER DEFAULT 0,
    updated_at      TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user
    ON roadmaps(user_id);

-- ─── Quiz History ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    topic           TEXT,
    score           INTEGER DEFAULT 0,
    total           INTEGER DEFAULT 0,
    percentage      REAL    DEFAULT 0.0,
    questions_data  TEXT,                       -- JSON blob
    taken_at        TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quiz_history_user
    ON quiz_history(user_id);

-- ─── File Uploads ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_uploads (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    session_id   TEXT,
    filename     TEXT    NOT NULL,
    file_type    TEXT,
    file_size    INTEGER DEFAULT 0,
    content_text TEXT,
    uploaded_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user
    ON file_uploads(user_id);

CREATE INDEX IF NOT EXISTS idx_file_uploads_session
    ON file_uploads(session_id);

CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS favourites (user_id INTEGER NOT NULL, channel_id TEXT NOT NULL, PRIMARY KEY(user_id,channel_id), FOREIGN KEY(user_id) REFERENCES users(id));
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);

-- Private household plan: maximum five provisioned accounts.
CREATE TRIGGER IF NOT EXISTS limit_five_users
BEFORE INSERT ON users
WHEN (SELECT COUNT(*) FROM users) >= 5
BEGIN
  SELECT RAISE(ABORT, 'Buffer Buddies supports a maximum of 5 accounts');
END;

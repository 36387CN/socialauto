const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "socialauto.db");
let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buf = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buf);
}

// Execute a query with optional bind params, returns {columns, values}
function query(sql, params) {
  if (!params || params.length === 0) {
    return db.exec(sql);
  }
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const cols = stmt.getColumnNames();
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.get());
  }
  stmt.free();
  return [{ columns: cols, values: rows }];
}

// Execute a statement with optional bind params (INSERT/UPDATE/DELETE)
function run(sql, params) {
  if (!params || params.length === 0) {
    db.run(sql);
  } else {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
  }
}

async function initDb() {
  const d = await getDb();
  const createUsers = "CREATE TABLE IF NOT EXISTS users ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "email TEXT UNIQUE NOT NULL,"
    + "password TEXT NOT NULL,"
    + "name TEXT,"
    + "company TEXT,"
    + "plan TEXT DEFAULT 'free',"
    + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
    + ")";
  db.run(createUsers);
  const createPosts = "CREATE TABLE IF NOT EXISTS posts ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "user_id INTEGER NOT NULL,"
    + "content TEXT NOT NULL,"
    + "platform TEXT NOT NULL,"
    + "scheduled_at DATETIME,"
    + "status TEXT DEFAULT 'draft',"
    + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP,"
    + "FOREIGN KEY (user_id) REFERENCES users(id)"
    + ")";
  db.run(createPosts);
  const createAnalytics = "CREATE TABLE IF NOT EXISTS analytics ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "user_id INTEGER NOT NULL,"
    + "platform TEXT NOT NULL,"
    + "impressions INTEGER DEFAULT 0,"
    + "clicks INTEGER DEFAULT 0,"
    + "interactions INTEGER DEFAULT 0,"
    + "date DATE DEFAULT CURRENT_DATE,"
    + "FOREIGN KEY (user_id) REFERENCES users(id)"
    + ")";
  db.run(createAnalytics);
  saveDb();
  return d;
}

module.exports = { getDb, initDb, saveDb, query, run };

initDb().catch(err => {
  console.error("DB init error:", err);
  process.exit(1);
});

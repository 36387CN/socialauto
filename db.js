const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "socialauto.db");
let db = null;
let ready = false;
var readyQueue = [];

function onReady() {
  return new Promise(function(resolve) {
    if (ready) return resolve();
    readyQueue.push(resolve);
  });
}

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

function query(sql, params) {
  if (!db) throw new Error("DB not initialized");
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

function run(sql, params) {
  if (!db) throw new Error("DB not initialized");
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
  await getDb();
  db.run("CREATE TABLE IF NOT EXISTS users ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "email TEXT UNIQUE NOT NULL,"
    + "password TEXT NOT NULL,"
    + "name TEXT,"
    + "company TEXT,"
    + "plan TEXT DEFAULT 'free'," +
    + "is_admin INTEGER DEFAULT 0,"
    + "referral_code TEXT UNIQUE,"
    + "referred_by INTEGER,"
    + "free_days INTEGER DEFAULT 7,"
    + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
    + ")");
  db.run("CREATE TABLE IF NOT EXISTS posts ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "user_id INTEGER NOT NULL,"
    + "content TEXT NOT NULL,"
    + "platform TEXT NOT NULL,"
    + "scheduled_at DATETIME,"
    + "status TEXT DEFAULT 'draft',"
    + "show_branding INTEGER DEFAULT 1,"
    + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP,"
    + "FOREIGN KEY (user_id) REFERENCES users(id)"
    + ")");
  db.run("CREATE TABLE IF NOT EXISTS analytics ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "user_id INTEGER NOT NULL,"
    + "platform TEXT NOT NULL,"
    + "impressions INTEGER DEFAULT 0,"
    + "clicks INTEGER DEFAULT 0,"
    + "interactions INTEGER DEFAULT 0,"
    + "date DATE DEFAULT CURRENT_DATE,"
    + "FOREIGN KEY (user_id) REFERENCES users(id)"
    + ")");
  db.run("CREATE TABLE IF NOT EXISTS referrals ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "referrer_id INTEGER NOT NULL,"
    + "referred_email TEXT NOT NULL,"
    + "status TEXT DEFAULT 'pending',"
    + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP,"
    + "FOREIGN KEY (referrer_id) REFERENCES users(id)"
    + ")");
  db.run("CREATE TABLE IF NOT EXISTS templates ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "title TEXT NOT NULL,"
    + "content TEXT NOT NULL,"
    + "category TEXT,"
    + "downloads INTEGER DEFAULT 0,"
    + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
    + ")");
  db.run("CREATE TABLE IF NOT EXISTS blog_posts ("
    + "id INTEGER PRIMARY KEY AUTOINCREMENT,"
    + "title TEXT NOT NULL,"
    + "slug TEXT UNIQUE NOT NULL,"
    + "summary TEXT,"
    + "content TEXT NOT NULL,"
    + "tags TEXT,"
    + "views INTEGER DEFAULT 0,"
    + "published INTEGER DEFAULT 0,"
    + "created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
    + ")");

    // Migration: add columns that may be missing from old schema
  try { db.run("ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN referred_by INTEGER"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN free_days INTEGER DEFAULT 7"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"); } catch(e) {}
  try { db.run("ALTER TABLE posts ADD COLUMN show_branding INTEGER DEFAULT 1"); } catch(e) {}
  try { db.run("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0"); } catch(e) {}
  // Migration: make first user admin if none exists
  var adminCheck = db.exec("SELECT COUNT(*) FROM users WHERE is_admin = 1");
  if (adminCheck[0].values[0][0] === 0) {
    var userCount = db.exec("SELECT COUNT(*) FROM users");
    if (userCount[0].values[0][0] > 0) {
      db.run("UPDATE users SET is_admin = 1 WHERE id = (SELECT id FROM users ORDER BY id LIMIT 1)");
    }
  }
  // Seed templates
  var tCount = db.exec("SELECT COUNT(*) FROM templates");
  if (tCount[0].values[0][0] === 0) {
    db.run("INSERT INTO templates (title, content, category) VALUES (?, ?, ?)",
      ["朋友圈营销文案模板", "【新品上线】感谢支持！新品来了...限时优惠！#新品", "文案模板"]);
    db.run("INSERT INTO templates (title, content, category) VALUES (?, ?, ?)",
      ["节日问候模板", "祝大家节日快乐！感谢一路有你们。", "文案模板"]);
    db.run("INSERT INTO templates (title, content, category) VALUES (?, ?, ?)",
      ["产品促销模板", "限时特惠！原价X，现在只要Y！", "营销模板"]);
    db.run("INSERT INTO templates (title, content, category) VALUES (?, ?, ?)",
      ["客户好评模板", "感谢信任！客户满意是我们的动力。", "品牌模板"]);
    db.run("INSERT INTO templates (title, content, category) VALUES (?, ?, ?)",
      ["招聘信息模板", "期待你的加入！欢迎投递简历。", "企业模板"]);
  }

  // Seed blog posts
  var bCount = db.exec("SELECT COUNT(*) FROM blog_posts");
  if (bCount[0].values[0][0] === 0) {
    var seo = [
      ["小企业社媒运营完全指南（2026版）", "xiao-qi-ye-she-mei-yun-ying-wan-quan-zhi-nan", "从0搭建小企业社媒运营体系。"],
      ["朋友圈营销：小企业月增100客户", "peng-you-quan-ying-xiao-ji-qiao", "5个朋友圈营销技巧，低成本获客。"],
      ["免费社媒管理工具推荐", "mian-fei-she-mei-guan-li-gong-ju", "2026年最好用的免费社媒管理工具。"],
      ["抖音短视频运营入门教程", "dou-yin-duan-shi-pin-yun-ying", "小企业从0做抖音完整教程。"],
      ["小红书种草营销攻略", "xiao-hong-shu-zhong-cao-ying-xiao", "用好小红书实现品牌爆发。"],
    ];
    for (var i = 0; i < seo.length; i++) {
      db.run("INSERT INTO blog_posts (title, slug, summary, content, tags, published) VALUES (?, ?, ?, ?, ?, 1)",
        [seo[i][0], seo[i][1], seo[i][2], seo[i][2] + " 完整版注册后查看。", "社媒运营,小企业"]);
    }
  }

  saveDb();
  ready = true;
  readyQueue.forEach(function(fn) { fn(); });
  readyQueue = [];
}

initDb().catch(function(err) {
  console.error("DB init error:", err);
  process.exit(1);
});

module.exports = { getDb, initDb, saveDb, query, run, onReady };






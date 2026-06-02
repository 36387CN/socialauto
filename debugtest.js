var db = require('./db');
db.onReady().then(function() {
  var cols = db.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
  console.log('Schema:', cols[0].values[0][0]);
  
  // Test insert directly
  var bcrypt = require('bcryptjs');
  var crypto = require('crypto');
  var email = 'test@test.com';
  bcrypt.hash('test123', 10).then(function(hashed) {
    var code = 'SA' + crypto.randomBytes(4).toString('hex').toUpperCase();
    try {
      db.run("INSERT INTO users (email, password, name, company, referral_code, referred_by, free_days, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT CASE WHEN (SELECT COUNT(*) FROM users) = 0 THEN 1 ELSE 0 END))",
        [email, hashed, 'Test', 'TestCo', code, null, 7]);
      db.saveDb();
      console.log('INSERT OK');
    } catch(e) { console.error('ERROR:', e.message); }
    process.exit();
  });
}).catch(function(e) { console.error('DB init error:', e); process.exit(1); });

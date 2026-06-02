const express = require("express");
const bcrypt = require("bcryptjs");
const { query, run, saveDb } = require("../db");
const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("login", { title: "登录", error: null });
});

router.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("register", { title: "注册", error: null });
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    if (!email || !password) {
      return res.render("register", { title: "注册", error: "邮箱和密码不能为空" });
    }
    const existing = query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.render("register", { title: "注册", error: "该邮箱已注册" });
    }
    const hashed = await bcrypt.hash(password, 10);
    run("INSERT INTO users (email, password, name, company) VALUES (?, ?, ?, ?)",
      [email, hashed, name || "", company || ""]);
    saveDb();
    const rows = query("SELECT id, email, name, company, plan FROM users WHERE email = ?", [email]);
    const user = rows[0].values[0];
    req.session.user = {
      id: user[0], email: user[1], name: user[2], company: user[3], plan: user[4]
    };
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("register", { title: "注册", error: "注册失败，请稍后再试" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render("login", { title: "登录", error: "邮箱和密码不能为空" });
    }
    const rows = query("SELECT id, email, password, name, company, plan FROM users WHERE email = ?", [email]);
    if (rows.length === 0 || rows[0].values.length === 0) {
      return res.render("login", { title: "登录", error: "邮箱或密码错误" });
    }
    const user = rows[0].values[0];
    const match = await bcrypt.compare(password, user[2]);
    if (!match) {
      return res.render("login", { title: "登录", error: "邮箱或密码错误" });
    }
    req.session.user = {
      id: user[0], email: user[1], name: user[3], company: user[4], plan: user[5]
    };
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("login", { title: "登录", error: "登录失败，请稍后再试" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;

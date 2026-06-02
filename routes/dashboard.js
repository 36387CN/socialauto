const express = require("express");
const { query, run, saveDb } = require("../db");
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/auth/login");
  next();
}
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const postCount = query("SELECT COUNT(*) as c FROM posts WHERE user_id = ?", [userId]);
    const totalPosts = postCount[0].values[0][0];
    const analytics = query("SELECT COALESCE(SUM(impressions),0), COALESCE(SUM(clicks),0), COALESCE(SUM(interactions),0) FROM analytics WHERE user_id = ?", [userId]);
    const totalImpressions = analytics[0].values[0][0];
    const totalClicks = analytics[0].values[0][1];
    const totalInteractions = analytics[0].values[0][2];
    const recentPosts = query("SELECT id, content, platform, scheduled_at, status FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 5", [userId]);
    const posts = recentPosts.length > 0 ? recentPosts[0].values.map(function(r) {
      return { id: r[0], content: r[1], platform: r[2], scheduled_at: r[3], status: r[4] };
    }) : [];
    res.render("dashboard", {
      title: "控制台",
      totalPosts: totalPosts,
      totalImpressions: totalImpressions,
      totalClicks: totalClicks,
      totalInteractions: totalInteractions,
      posts: posts
    });
  } catch (err) {
    console.error(err);
    res.send("加载失败");
  }
});

router.get("/posts", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = query("SELECT id, content, platform, scheduled_at, status, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    const posts = result.length > 0 ? result[0].values.map(function(r) {
      return { id: r[0], content: r[1], platform: r[2], scheduled_at: r[3], status: r[4], created_at: r[5] };
    }) : [];
    res.render("posts", { title: "内容管理", posts: posts });
  } catch (err) {
    console.error(err);
    res.send("加载失败");
  }
});

router.get("/posts/new", (req, res) => {
  res.render("post-new", { title: "新建内容" });
});

router.post("/posts", async (req, res) => {
  try {
    const { content, platform, scheduled_at } = req.body;
    if (!content || !platform) {
      return res.redirect("/dashboard/posts/new");
    }
    run("INSERT INTO posts (user_id, content, platform, scheduled_at, status) VALUES (?, ?, ?, ?, ?)",
      [req.session.user.id, content, platform, scheduled_at || null, scheduled_at ? "scheduled" : "draft"]);
    saveDb();
    res.redirect("/dashboard/posts");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts/new");
  }
});

router.post("/posts/:id/delete", async (req, res) => {
  try {
    run("DELETE FROM posts WHERE id = ? AND user_id = ?", [parseInt(req.params.id), req.session.user.id]);
    saveDb();
    res.redirect("/dashboard/posts");
  } catch (err) {
    console.error(err);
    res.redirect("/dashboard/posts");
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = query("SELECT platform, COALESCE(SUM(impressions),0), COALESCE(SUM(clicks),0), COALESCE(SUM(interactions),0) FROM analytics WHERE user_id = ? GROUP BY platform", [userId]);
    const data = result.length > 0 ? result[0].values.map(function(r) {
      return { platform: r[0], impressions: r[1], clicks: r[2], interactions: r[3] };
    }) : [];
    res.render("analytics", { title: "数据分析", data: data });
  } catch (err) {
    console.error(err);
    res.send("加载失败");
  }
});

router.get("/settings", (req, res) => {
  res.render("settings", { title: "设置", user: req.session.user });
});

router.post("/settings", async (req, res) => {
  try {
    const { name, company } = req.body;
    run("UPDATE users SET name = ?, company = ? WHERE id = ?", [name || "", company || "", req.session.user.id]);
    saveDb();
    req.session.user.name = name || "";
    req.session.user.company = company || "";
    res.render("settings", { title: "设置", user: req.session.user });
  } catch (err) {
    console.error(err);
    res.render("settings", { title: "设置", user: req.session.user });
  }
});

module.exports = router;

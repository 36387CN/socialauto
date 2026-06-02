const express = require("express");
const session = require("express-session");
const path = require("path");
const { onReady, query } = require("./db");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "socialauto-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(function(req, res, next) {
  res.locals.user = req.session.user || null;
  next();
});

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);

app.get("/blog", function(req, res) {
  try {
    var result = query("SELECT id, title, slug, summary, tags, created_at, views FROM blog_posts WHERE published = 1 ORDER BY created_at DESC");
    var posts = result.length > 0 ? result[0].values.map(function(r) {
      return { id: r[0], title: r[1], slug: r[2], summary: r[3], tags: r[4], created_at: r[5], views: r[6] };
    }) : [];
    res.render("blog", { title: "社媒运营博客", posts: posts });
  } catch(e) {
    console.error("Blog error:", e);
    res.status(500).send("加载失败");
  }
});

app.get("/blog/:slug", function(req, res) {
  try {
    var result = query("SELECT id, title, slug, summary, content, tags, created_at, views FROM blog_posts WHERE slug = ? AND published = 1", [req.params.slug]);
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).render("index", { title: "未找到" });
    }
    var p = result[0].values[0];
    var post = { id: p[0], title: p[1], slug: p[2], summary: p[3], content: p[4], tags: p[5], created_at: p[6], views: p[7] };
    res.render("blog-post", { title: post.title, post: post });
  } catch(e) {
    console.error("Blog detail error:", e);
    res.status(500).send("加载失败");
  }
});

app.get("/templates/list", function(req, res) {
  try {
    var result = query("SELECT id, title, category, downloads FROM templates ORDER BY downloads DESC");
    var templates = result.length > 0 ? result[0].values.map(function(r) {
      return { id: r[0], title: r[1], category: r[2], downloads: r[3] };
    }) : [];
    res.render("templates", { title: "免费社媒文案模板", templates: templates });
  } catch(e) {
    console.error("Templates error:", e);
    res.status(500).send("加载失败");
  }
});

app.get("/", function(req, res) {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("index", { title: "社媒自动化助手" });
});

app.get("/ref/:code", function(req, res) {
  res.render("register", {
    title: "注册 - 推荐好友享30天免费",
    error: null,
    ref: req.params.code
  });
});

app.use(function(req, res) {
  res.status(404).render("index", { title: "页面未找到" });
});

onReady().then(function() {
  app.listen(PORT, function() {
    console.log("Server running on http://localhost:" + PORT);
  });
}).catch(function(err) {
  console.error("Startup failed:", err);
  process.exit(1);
});

const express = require("express");
const session = require("express-session");
const path = require("path");
const { getDb } = require("./db");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Session
app.use(session({
  secret: "socialauto-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);

// Landing page
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("index", { title: "社媒自动化助手" });
});

// 404
app.use((req, res) => {
  res.status(404).render("index", { title: "页面未找到" });
});

app.listen(PORT, () => {
  console.log("社媒自动化助手 running on http://localhost:" + PORT);
});

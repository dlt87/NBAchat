require('dotenv').config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const passport = require("passport");
const TwitchStrategy = require("passport-twitch-new").Strategy;
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://dlt87.github.io",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 🔧 Required for Render & secure cookies
app.set("trust proxy", 1);

// ✅ Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "None",
    httpOnly: true
  }
}));

// ✅ Passport setup
app.use(passport.initialize());
app.use(passport.session());

// ✅ CORS (must be AFTER session & passport)
app.use(cors({
  origin: "https://dlt87.github.io",
  credentials: true
}));

// 🧠 Passport strategy
passport.use(new TwitchStrategy({
  clientID: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  callbackURL: "https://nbachat.onrender.com/auth/twitch/callback",
  scope: "user:read:email"
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// 🔐 Twitch login routes
app.get("/auth/twitch", passport.authenticate("twitch"));

app.get("/auth/twitch/callback",
  passport.authenticate("twitch", {
    failureRedirect: "https://dlt87.github.io/NBAchat-frontend/index.html"
  }),
  (req, res) => {
    res.redirect("https://dlt87.github.io/NBAchat-frontend/index.html");
  }
);

app.get("/auth/user", (req, res) => {
  console.log("🧪 Checking session user:", req.user);
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ user: null });
  }
});

app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("https://dlt87.github.io/NBAchat-frontend/index.html");
  });
});

// 📦 Serve static files if needed (optional)
// app.use(express.static(path.join(__dirname, 'public')));

// 💬 In-memory message storage
const messages = [];

let viewerCount = 0;

io.on("connection", (socket) => {
  console.log("🟢 A user connected");

  // Send chat history
  socket.emit("chat history", messages);

  socket.on("chat message", (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = { ...msg, time };
    messages.push(message);
    io.emit("chat message", message);
  });

  socket.on("user joined", (username) => {
    console.log(`${username} joined the chat`);
  });

  viewerCount++;
  io.emit('viewerCount', viewerCount);

  socket.on('disconnect', () => {
    console.log("🔴 A user disconnected");
    viewerCount--;
    io.emit('viewerCount', viewerCount);
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const chatHistory = [];

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all for dev — restrict in production!
  },
});

const messages = []; // store chat messages in memory

io.on('connection', (socket) => {
  console.log('a user connected');

  // Send previous messages
  socket.emit('chat history', messages);

  // When a message is sent
  // Store full message object
  socket.on('chat message', (msg) => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Vancouver' // <-- set the desired time zone here
    });

    const msgWithTime = {
      ...msg,
      time: formattedTime
    };

    messages.push(msgWithTime);
    io.emit('chat message', msgWithTime);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ALL TWITCH AUTHENTICATION STUFF BELOWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
require('dotenv').config();
const session = require('express-session');
const passport = require('passport');
const TwitchStrategy = require('passport-twitch-new').Strategy;

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Serialize/deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Configure Twitch strategy
passport.use(new TwitchStrategy({
  clientID: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  callbackURL: process.env.TWITCH_CALLBACK_URL,
  scope: 'user:read:email'
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

// Routes
app.get('/auth/twitch', passport.authenticate('twitch'));
app.get('/auth/twitch/callback',
  passport.authenticate('twitch', {
    failureRedirect: '/'
  }),
  (req, res) => {
    res.redirect('/'); // Redirect after successful login
  }
);

// Auth status
app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.json({ user: null });
  }
});

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

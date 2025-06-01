const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const chatHistory = [];
const cookie = require('cookie');

const app = express();

app.use(cors({
  origin: "https://dlt87.github.io",
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://dlt87.github.io", // allow all for dev — restrict in production!
  },
});

const messages = []; // store chat messages in memory

io.on('connection', (socket) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    const parsedCookies = cookie.parse(cookies || '');
    const raw = parsedCookies['connect.sid'];

    if (raw) {
      // Express session format: "s:<base64-signature>"
      const sid = raw.startsWith('s:') ? raw.slice(2).split('.')[0] : raw;

      // You can optionally verify this sid against session store here if needed

      console.log('User connected with session ID:', sid);
    }
  } catch (err) {
    console.error('Failed to parse cookies:', err);
  }

  console.log('a user connected');
  
  // Emit chat history
  socket.emit('chat history', messages);

  socket.on('chat message', (msg) => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Vancouver'
    });

    const msgWithTime = {
      ...msg,
      time: formattedTime
    };

    messages.push(msgWithTime);
    io.emit('chat message', msgWithTime);
  });

  // ➕ Send join message
  socket.on('user joined', (displayName) => {
    const joinMsg = {
      user: 'System',
      text: `${displayName} has joined the chat.`,
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Vancouver'
      })
    };
    messages.push(joinMsg);
    io.emit('chat message', joinMsg);
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
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,         // ✅ required for HTTPS
    sameSite: 'None',      // ✅ required for cross-site cookies
    httpOnly: true // ✅ helps prevent XSS attacks
  }
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
    res.redirect('https://dlt87.github.io/NBAchat-frontend/index.html'); // Redirect after successful login
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

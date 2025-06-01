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
      timeZone: 'America/New_York' // <-- set the desired time zone here
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

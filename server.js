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
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msgWithTime = {
      ...msg,
      time: formattedTime
    };

    messages.push(msgWithTime);           // Store message with time
    io.emit('chat message', msgWithTime); // Broadcast message with time
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
  }
});

app.use(express.static(__dirname+"/public"))

io.on('connection', (socket) => {
  console.log('a user connected');
  let username = "";

  socket.on('disconnect', () => {
    console.log('a user disconnected')
  })

  socket.on('joinRoom', (data) => {
    console.log('joinRoom', data)
    socket.join(data.room)
    username = data.username
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
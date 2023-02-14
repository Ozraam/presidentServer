import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Player } from "./game/Player.js"

const app = express();
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
  }
});

const rooms = new Map();

//app.use(express.static(__dirname+"/public"))

io.on('connection', (socket) => {
  console.log('a user connected');
  let username = "";

  socket.on('disconnect', () => {
    console.log('a user disconnected')
  })

  socket.on('joinRoom', (data) => {
    console.log(rooms, rooms.has(data.roomNumber));
    socket.join(data.roomNumber)
    username = data.username

    if (rooms.has(data.roomNumber)) {
      rooms.get(data.roomNumber).push(new Player(data.username))
    } else {
      rooms.set(data.roomNumber, [new Player(data.username)])
    }

    sendData(data.roomNumber, rooms.get(data.roomNumber), socket, 'getPlayers')
  });
});

function sendData(room, data, socket, event, time = 500) {
  
  setTimeout(() => {
    console.log("sending data");
    io.to(room).emit(event, data);
  }, time);
}

server.listen(3000, () => {
  console.log('listening on *:3000');
});
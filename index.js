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

    if (rooms.has(data.roomNumber)) {
      if(!rooms.get(data.roomNumber).players.find(player => player.name === data.username)) {
        rooms.get(data.roomNumber).players.push(new Player(data.username))
      } else {
        console.log('player already exists');
        socket.emit('playerExists', {message: 'player already exists'})
        return;
      }
    } else {
      rooms.set(data.roomNumber, {players: [new Player(data.username)], chat: [], game: null})
    }
    
    socket.join(data.roomNumber)
    username = data.username

    sendData(data.roomNumber, rooms.get(data.roomNumber).players, socket, 'getPlayers')
  });

  socket.on("connectToRoom", (data) => {
    if(data.username != username) {
      console.log('username does not match');
      socket.emit('usernameDoesNotMatch', {message: 'username does not match'})
      return;
    }

    if (!rooms.has(data.roomNumber)) {
      console.log('no room');
      socket.emit('noRoom', {message: 'no room'})
      return;
    }

    socket.join(data.roomNumber)
    sendData(data.roomNumber, rooms.get(data.roomNumber).players, socket, 'getPlayers')
  });

  socket.on("chat", (data) => {
    console.log(data, username);
    if(data.name != username) {
      console.log('username does not match');
      socket.emit('usernameDoesNotMatch', {message: 'username does not match'})
      return;
    }

    if (!rooms.has(data.roomNumber)) {
      console.log('no room');
      socket.emit('noRoom', {message: 'no room'})
      return;
    }

    rooms.get(data.roomNumber).chat.push({name: data.name, message: data.message})
    sendData(data.roomNumber, rooms.get(data.roomNumber).chat, socket, 'getChat')
  });



  socket.on("disconnectFromRoom", (data) => {
    if(data.username != username) {
      console.log('username does not match');
      socket.emit('usernameDoesNotMatch', {message: 'username does not match'})
      return;
    }

    if (!rooms.has(data.roomNumber)) {
      console.log('no room');
      socket.emit('noRoom', {message: 'no room'})
      return;
    }

    socket.leave(data.roomNumber)
    rooms.get(data.roomNumber).players.splice(rooms.get(data.roomNumber).players.findIndex(player => player.username === data.username), 1)

    sendData(data.roomNumber, rooms.get(data.roomNumber).players, socket, 'getPlayers')
  });
});

function sendData(room, data, socket, event, time = 500) {
  console.log(`sending ${event} to ${room} with data ${data}`);
  io.to(room).emit(event, data);
}

server.listen(3000, () => {
  console.log('listening on *:3000');
});
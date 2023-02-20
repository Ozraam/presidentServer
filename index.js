import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Player } from "./game/Player.js"
import { PresidentGame } from "./game/PresidentGame.js"

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

    sendData(data.roomNumber, rooms.get(data.roomNumber).players, 'getPlayers')+
    sendData(data.roomNumber, rooms.get(data.roomNumber).chat, 'getChat')
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
    rooms.get(data.roomNumber).players.filter(player => player.name === data.username)[0].leaving = false
    sendData(data.roomNumber, rooms.get(data.roomNumber).players, 'getPlayers')
  });

  socket.on("leaveRoom", (data) => {
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

    if(rooms.get(data.roomNumber).players.filter(player => player.name === data.username).length === 0) {
      console.log('player does not exist');
      socket.emit('playerDoesNotExist', {message: 'player does not exist'})
      return;
    }

    socket.leave(data.roomNumber)
    rooms.get(data.roomNumber).players.filter(player => player.name === data.username)[0].leaving = true
    sendData(data.roomNumber, rooms.get(data.roomNumber).players, 'getPlayers')
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
    sendData(data.roomNumber, rooms.get(data.roomNumber).chat, 'getChat')
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
    rooms.get(data.roomNumber).players.splice(rooms.get(data.roomNumber).players.findIndex(player => player.name === data.username), 1)
    console.log(data.username);
    console.log(rooms.get(data.roomNumber).players);

    sendData(data.roomNumber, rooms.get(data.roomNumber).players, 'getPlayers')

    if(rooms.get(data.roomNumber).players.length === 0) {
      rooms.delete(data.roomNumber)
    }
  });



  // ------------------ GAME ------------------

  socket.on("startGame", (data) => {

    if (!rooms.has(data.roomNumber)) {
      console.log('no room');
      socket.emit('noRoom', {message: 'no room'});
      return;
    }

    /** @type {Player[]} */
    let players = rooms.get(data.roomNumber).players;

    players = players.filter(player => !player.leaving);
    rooms.set(data.roomNumber, {players: players, chat: rooms.get(data.roomNumber).chat, game: null});

    if(players.length < 4) {
      console.log('not enough players');
      socket.emit('gameStateStart', "notStarted");
      return;
    }

    sendData(data.roomNumber, "started", 'gameStateStart');

    let game = new PresidentGame();
    for(let player of players) {
      game.addPlayer(player);
    }
      
    game.setup();

    rooms.get(data.roomNumber).game = game;
    sendData(data.roomNumber, game.players, 'getPlayers');

    if(game.canStart()) {
      sendData(data.roomNumber, game, 'getGame');
    }
  });

  socket.on("cardEchange", (data) => {
    // data = {roomNumber: string, username: string, cards: Card[]}
    if(data.username != username) {
      console.log('username does not match');
      socket.emit('usernameDoesNotMatch', {message: 'username does not match'});
      return;
    }

    if (!rooms.has(data.roomNumber)) {
      console.log('no room');
      socket.emit('noRoom', {message: 'no room'});
      return;
    }

    if(!rooms.get(data.roomNumber).game) {
      console.log('no game');
      socket.emit('noGame', {message: 'no game'});
      return;
    }

    /** @type {PresidentGame} */
    let game = rooms.get(data.roomNumber).game;

    if(game.started || game.canStart()) {
      console.log('game already started');
      socket.emit('gameAlreadyStarted', {message: 'game already started'});
      return;
    }

    let player = game.players.filter(player => player.name === data.username)[0];
    // if player is rank 3 use viceLooserGive, if 4 use looserGive, if 1 use vicePresidentGive and card[], if 0 presidentGive and card[] given in data
    if(player.rank === 3) {
      game.viceLooserGive(data);
    } else if(player.rank === 4) {
      game.looserGive(data.cards);
    } else if(player.rank === 1) {
      game.vicePresidentGive(data);
    } else if(player.rank === 0) {
      game.presidentGive(data.cards);
    } else {
      console.log('not a valid rank');
      socket.emit('notValidRank', {message: 'not a valid rank'});
      return;
    }

    sendData(data.roomNumber, rooms.get(data.roomNumber).players , socket, 'getPlayers');

    if(game.canStart()) {
      sendData(data.roomNumber, game, 'getGame');
    }
  });

  socket.on("cardPlay", (data) => {
    // data = {roomNumber: string, username: string, cards: Card[]}
    if(data.username != username) {
      console.log('username does not match');
      socket.emit('usernameDoesNotMatch', {message: 'username does not match'});
      return;
    }

    if (!rooms.has(data.roomNumber)) {
      console.log('no room');
      socket.emit('noRoom', {message: 'no room'});
      return;
    }

    if(!rooms.get(data.roomNumber).game) {
      console.log('no game');
      socket.emit('noGame', {message: 'no game'});
      return;
    }

    /** @type {PresidentGame} */
    let game = rooms.get(data.roomNumber).game;

    let player = game.players.filter(player => player.name === data.username)[0];

    if(!game.started) {
      game.start(data.cards, player);
    } else {
      game.playCards(data.cards);
    }

    sendData(data.roomNumber, game, 'getGame');
  });


  socket.on("cardPass", (data) => {
    // data = {roomNumber: string, username: string}
    if(data.username != username) {
      console.log('username does not match');
      socket.emit('usernameDoesNotMatch', {message: 'username does not match'});
      return;
    }

    if (!rooms.has(data.roomNumber)) {
      console.log('no room');
      socket.emit('noRoom', {message: 'no room'});
      return;
    }

    if(!rooms.get(data.roomNumber).game) {
      console.log('no game');
      socket.emit('noGame', {message: 'no game'});
      return;
    }

    /** @type {PresidentGame} */
    let game = rooms.get(data.roomNumber).game;

    game.pass();

    sendData(data.roomNumber, game, 'getGame');
  });

  socket.on("stealRound", (data) => {
    // data = {roomNumber: string, username: string}
    if(data.username != username) {
      console.log('username does not match');
      socket.emit('usernameDoesNotMatch', {message: 'username does not match'});
      return;
    }

    if (!rooms.has(data.roomNumber)) {
      console.log('no room');
      socket.emit('noRoom', {message: 'no room'});
      return;
    }

    if(!rooms.get(data.roomNumber).game) {
      console.log('no game');
      socket.emit('noGame', {message: 'no game'});
      return;
    }

    /** @type {PresidentGame} */
    let game = rooms.get(data.roomNumber).game;
    let player = game.players.filter(player => player.name === data.username)[0];
    game.stealCards(player);

    sendData(data.roomNumber, game, 'getGame');
  });











});

function sendData(room, data, event) {
  console.log(`sending ${event} to ${room} with data ${data}`);
  io.to(room).emit(event, data);
}

server.listen(3000, () => {
  console.log('listening on *:3000');
});
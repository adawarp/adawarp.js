/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */
'use strict';

const path = require("path");

const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require('socket.io')(server);
const peers = {};
let userCount = 0;

io.on("connect", (socket) => {
  console.log("Connected", socket.id);

  socket.on("login", (credential) => {
    console.log("atempt to login ", credential);
    if (credential) {
      console.log("logged in");
    } else {
      console.log("anonymous log in");
    }

    if (!login(socket, credential)) {
      return; 
    }

    socket.on("disconnect", () => {
      logout(socket);
    });

    socket.on("public-chat", (message) => {
      console.log("receive public chat message", message);
      io.emit("public-chat", message);
    });

    socket.on("ring", (request) => {
      console.log("receive ring request", request);
      ring(request);
    });
    
    socket.on("response", (resp) => {
      console.log("receive ring response", resp);
      response(resp);
    });

    socket.on("candidate", (candidate) => {
      console.log("receive candidate", candidate);
      pass(candidate);
    });
  });
});

app.use(express.static(path.join(__dirname, '../client')));
app.use('/dist', express.static(path.join(__dirname, '../../dist')));
server.listen(3333, "0.0.0.0");
console.log("listening on port 3333");

function broadcastPeerList() {
  io.emit("updatePeerList", getPeerList());
}

function login(socket, user) {
  let credential;
  if (user["credential"]) {
    if (user.credential["username"] === null || user.credential["username"] === undefined) {
      user.credential["username"] = socket.id;
    } else if (isAlreadyLoggedIn(user.credential["username"])) {
      socket.emit("authentication_error", "already logged in");
      return;
    }
    credential = user.credential;
  } else {
    credential = {
      username: userCount
    };
  }
  user["id"] = userCount;
  user["socket"] = socket;
  let userInfo = convertToPeerInfo(user);
  user["info"] = userInfo;
  peers[user.id] =  user;
  socket.emit("login", userInfo);
  userCount++;
  broadcastPeerList();
  return userInfo;
}

function isAlreadyLoggedIn(username) {
  console.log("\n\n" , username , "\n\n");
  for (let i in  peers) {
    if (peers[i].info.username === username) {
      return true;
    }
  }
  return false;
}

function logout(socket) {
  for (let id in peers) {
    if (peers[id].socket === socket) { 
      delete peers[id];
    }
  }
  broadcastPeerList();
}

function isLoggedIn(socket) {
  return peers.has(socket);  
}

function convertToPeerInfo(user) {
  return {
   //  id: user.credential.username,
    id: user.id,
    name: user.credential.username,
    agents: user.availableAgents
  }
}

function getPeerList() {
  let list = [];
  for (let i in peers) {
    list.push(peers[i].info);
  }
  return list;
}

function getPeer(header) {
  for (let i in peers) {
    let peer = peers[i];
    if (peer.id == header.id) {
      return peer;
    }
  }
  return null;
}

function ring(request) {
  let ringee = getPeer(request.header.receiver);
  console.log(ringee.info);
  ringee.socket.emit("ring", request );
}

function response(resp) {
  let ringer = getPeer(resp.header.receiver);
  console.log(ringer.info);
  ringer.socket.emit("response", resp);
}

function pass(candidate) {
  let receiver= getPeer(candidate.header.receiver);
  receiver.socket.emit("candidate", candidate);
}

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var peers = new Peers();

app.use(express.static('client'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/push', function(req, res){
  console.log(req.query.key);
  res.send("hello world");
});

io.sockets.on('connection',function(socket){
  console.log("Connected with websocket from ",socket.handshake.address);
  var peer = null;
  socket.on('register',function(user){
    //add peer to peers array , if peer does not exist. and return id
    peer = peers.findOrCreateByName(user, socket);
    socket.emit('registerAck', peer.id);
  });

  socket.on('fetchPeers', function(){
    socket.emit('servePeers', peers);
  });

  socket.on('offer', function(remoteId,sdp){
    var remotePeer = peers.find(remoteId);
    if(remotePeer){
      peer.sdp = sdp;
      remotePeer.socket.emit('call',peer.id, sdp);
    } else {
      throw new Error("Remote Peer not found ", remotePeer);
    }
  });

  socket.on('answer', function(remoteId, sdp){
    var remotePeer = peers.find(remoteId);
    if(remotePeer){
      peer.sdp = sdp;
      remotePeer.socket.emit('response',peer.id, sdp);
    } else {
      throw new Error("Remote Peer not found ", remotePeer);
    }
  });

  socket.on('sendIceCandidate', function(remoteId, candidate){
    var remotePeer = peers.find(remoteId);
    if(remotePeer){
      console.log("Add ICE Candidate :", candidate);
      remotePeer.socket.emit('sendIceCandidate',peer.id, candidate);
    } else {
      throw new Error("Remote Peer not found ", remotePeer);
    }
  });

  socket.on('disconnect',function(){
    console.log("user disconnected");
  });

});

var server = http.listen(3000, function(){
  var host = server.address().address;
  var port = server.address().port;
  console.log("Listening at http:%s:%s", host, port); 
});

function Peers(){
  var _peers = [];

  function register (name,socket){
    var id = generateId();
    var peer = new Peer(id, name, socket);
    _peers.push(peer);
    return peer;    
  }

  function destroy (){

  }

  function generateId(){
    var candidateId = Math.floor(Math.random()*1000);
    while(find(candidateId)){
      candidateId = Math.floor(Math.random()*1000);
    }
    return candidateId;
  }

  function findOrCreateByName(name,socket){
    var peer = findByName(name);
    if(!peer){
      peer = register(name,socket);
    }
    return peer;
  }

  function findByName(name){
    var i = 0;
    for(i=0; i<_peers.length; i++){
      if(_peers[i].name == name) return _peers[i];    
    }
    return null;
  }

  function find(id){
    var i = 0;
    for(i=0; i<_peers.length; i++){
      if(_peers[i].id == id) return _peers[i];    
    }
    return null;
  }

  return {
    register : register,
    find : find,
    destroy : destroy,
    findOrCreateByName : findOrCreateByName
  };
}

function Peer(id, name, socket){
  var _id = id,
      _name = name,
      _sdp = null,
      _socket = socket
       ;

  function addEventListener(key, fn){

  }

  function removeEventListener(key){

  }


  return {
    addEventListener : addEventListener,
    removeEventListener : removeEventListener,
    get id(){ return _id; },
    get name(){ return _name; },
    get sdp(){ return _sdp; },
    set sdp(sdp){ _sdp = sdp; },
    get socket(){ return _socket; },
    set socket(socket){ _socket = socket; }
  }
}

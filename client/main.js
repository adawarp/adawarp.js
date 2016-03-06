var config = {iceServers:[
// {url:"stun:stun.l.google.com:19302"}
 {url:"stun:horol.local:3478"}
]};
var peer = null, dataChannel, peerId = null, remotePeerId = null;
var constraints = {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true };
var socket = null;
if(!window.hasOwnProperty('RTCPeerConnection')){ 
  window.RTCPeerConnection = webkitRTCPeerConnection;
}

window.onload = function(){
  socket = io.connect();

  socket.emit('register',Math.random());

  socket.on('registerAck',function(id){
    console.log(id);
    peerId = id;
    var div = document.createElement('div');
    div.textContent = "Peer ID : " + peerId;
    document.body.appendChild(div);
    document.title = div.textContent;
  });

  socket.on('call',function(remoteId, remoteSdp){
    console.log("Calling from ",remoteId);
    remotePeerId = remoteId;
    setOffer(remoteSdp);
  });

  socket.on('response',function(remoteId, remoteSdp){
    console.log("Response from ",remoteId);
    setAnswer(remoteSdp);
  });

  socket.on('sendIceCandidate',function(id,candidate){
    console.log("Receive remote ICE Candidate",id, candidate);
    setRemoteCandidate(candidate);
  });
}

function createOffer(remoteId){
  peer = new RTCPeerConnection(config); 

  peer.onicecandidate = function (event) {
    if (event.candidate) {
      var candidate = {type: "candidate", 
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sdpMid: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      };
      console.log(JSON.stringify(candidate).replace(/\\r\\n/g, '\n'));
      console.log("On Ice candidate created , ",peer.localDescription.sdp);
      if(remotePeerId){
        sendIceCandidate(remotePeerId, event.candidate);
      }
    } else {
      console.log("End of candidates. ------------------- phase=" + event.eventPhase);
    }
  };

  dataChannel = peer.createDataChannel("chat");
  dataChannel.onopen = function(){console.log("DC open")};
  dataChannel.onclose= function(){console.log("DC close")};
  dataChannel.onmessage = function(msg){console.log("msg receive :",msg)};

  peer.createOffer(function(sessionDescription){
    console.log(sessionDescription);
    console.log(JSON.stringify(sessionDescription).replace(/\\r\\n/g, '\n'));
    peer.setLocalDescription(sessionDescription);
    var offer = JSON.stringify(sessionDescription).replace(/\\r\\n/g, '\n');
    document.querySelector('#sdp-offer').value = offer;
    socket.emit('offer', remoteId, offer);
  }, function(err){
    console.log("Failed to create offer",err);
  }, constraints);
}

function sendIceCandidate(remoteId, candidate){
  socket.emit('sendIceCandidate',remoteId, candidate);
}

function setAnswer(sdp){
  //var answerString = document.querySelector('#sdp-answer').value
  sdp = sdp.replace(/\n/g,'\\r\\n');;
  peer.setRemoteDescription(new RTCSessionDescription( JSON.parse(sdp)),
      function(e){
        console.log(e,"success to set answer");
      },function(err){console.log(err,"err")
  });
}

function setOffer( sdpOfferString ){
  //var sdpOfferString =  document.querySelector('#sdp-offer').value;
  offer = JSON.parse(sdpOfferString.replace(/\n/g, '\\r\\n'));
  peer = new RTCPeerConnection(config);
  peer.onicecandidate = function (event) {
    if (event.candidate) {
      var candidate = {type: "candidate", 
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        sdpMid: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      };
      if(remotePeerId){
        sendIceCandidate(remotePeerId, event.candidate);
      }
    } else {
      console.log("End of candidates. ------------------- phase=" + event.eventPhase);
    }
  };

  peer.ondatachannel = function(e){

    dataChannel = e.channel;
    dataChannel.onopen = function(){console.log("DC open")};
    dataChannel.onclose= function(){console.log("DC close")};
    dataChannel.onmessage = function(msg){
      console.log("msg receive :",msg);document.querySelector('#chat').textContent += msg.data + "\n";
          
    };
  };
  peer.setRemoteDescription(new RTCSessionDescription( offer ),createAnswer,function(err){console.log(err,"err")});
}

function createAnswer(){
  peer.createAnswer(function (sessionDescription) { 
    peer.setLocalDescription(sessionDescription);
    var sdpAnswerString = JSON.stringify(sessionDescription).replace(/\\r\\n/g, '\n');
    document.querySelector('#sdp-answer').value = sdpAnswerString;
    socket.emit('answer', remotePeerId, sdpAnswerString);
  },
  function (err) { 
    console.log("Failed to create answer",err);
  },
  constraints);
}

function setRemoteCandidate( candidateString ){
  //var candidate = new RTCIceCandidate( JSON.parse(candidateString) );
  var candidate = new RTCIceCandidate(candidateString);
  peer.addIceCandidate(candidate);
}

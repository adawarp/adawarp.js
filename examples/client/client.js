/* vim: set ft=javascript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */
'use strict';
window.onload = main;

function main() {
  const user = location.hash.replace(/#?user=(\w+)/, "$1");
  const config = {
    uuid: null,
    signalingServerURL: window.location.origin,
    signalingServerType: "socketio",
    credential: {
      username: user ? user : null,
      password: "hogepiyo"
    }
  };
  let hole = new Adawarp(config); 
  window["hole"] = hole;

  const chatInput = document.getElementById("chat-input");
  const chatSubmit = document.getElementById("chat-submit");
  const chatMessages = document.getElementById("chat-messages");

  // when other peer connected
  hole.on("updatePeerList", function(peers) {
    console.log(peers);
    setPeerList(peers);
  });

  hole.on("ringRequest", function(request) {
    console.log("Receive Request: ",request);
  });

  hole.on("ringResponse", function(request) {
    console.log("Receive Answer",request);
  });

  hole.on("login", function(peerInfo) {
    console.log(peerInfo);
    if (peerInfo) {
      setText("username", peerInfo.name);
    }
  });

  hole.on("signalingServerError", function(error) {
    console.log(error);
  });

  hole.on("data", function(data) {
    console.log(data);
  });

  hole.on("connectionStateChange", function(state) { 
    console.log("signaling server connection state changed", state);
    setText("connectionState", state.type);
    if (state.type === "reconnect") {
      hole.dispose();
      hole = null;
      setTimeout(main, 0);
    }
  });

  hole.on("receiveChatMessage", function(message) {
    const messageElement = document.createElement("li");
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
  });

  hole.on("close", function(event) {
    console.log("connection closed");
  });

  chatSubmit.onclick = function() {
    const message = chatInput.value;
    sendChatMessage(message);
    chatInput.value = "";
  }

  hole.login();

}

function sendChatMessage(message) {
  if (hole) {
    hole.sendChatMessage(message);
  }
}

function setPeerList(peerInfoList) {
  let list = document.getElementById("peer-list");
    
  list.innerHTML = "";
  for (let i in peerInfoList) {
    (function(info) { 
      if (hole.info.name === info.name) {
        return ;
      }
     let e = document.createElement("li");
     let text = document.createElement("span");
     e.textContent = `${i}: ${peerInfoList[i].name}`;
     let ringButton = document.createElement("button");
     ringButton.textContent = "Connect";
     ringButton.onclick = function() {
       hole.ring(info.id);
     };
     e.append(text);
     e.append(ringButton);
     list.appendChild(e);
    })(peerInfoList[i]);
  }
}

function setText(id, text) {
  let elem = document.getElementById(id);
  if (elem) {
    elem.textContent = text;
  }
}


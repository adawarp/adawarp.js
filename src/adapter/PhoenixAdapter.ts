/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import * as Phoenix from "./Phoenix";
import {SignalingAdapter} from "./SignalingAdapter";
import {SignalingDispatcher} from "../intent/SignalingDispatcher";
import {SignalingActionCreator} from "../intent/SignalingActionCreator";
import {Config} from "../Config";
import * as Debug from "debug";

const debug = Debug("decot:signaling:adapter");
const debugPhoenix = Debug("decot:signaling:phoenix");

export class PhoenixAdapter extends SignalingAdapter {

  private _socket: Phoenix.Socket;
  private _channel: Phoenix.Channel;

  private name: string;

  constructor(config: Config) {
    super();
    this._uuid = config.uuid;
    this._action = new SignalingActionCreator();
    this._dispatcher = this._action.dispatcher;

    this._socket = new Phoenix.Socket(config.signalingServerURL + "/socket", {
      logger: (kind, msg, data) => { debugPhoenix(`${kind}: ${msg}`, data); }
    });

    this._socket.connect();

    this._socket.onClose(() => {
      debug("disconnected");
      this._dispatcher.serverStatusChanged.next({url: "", isOnline: false});
      // who should handle the network error?
      // this.onClose.next(undefined);
    });


    this._channel = this._socket.channel("rooms:lobby", {uuid: this._uuid});
    this._channel.on("peers_list", this.updatePeersList.bind(this));

    this._channel.join()
      .receive("ok", (res) => {
        this._dispatcher.serverStatusChanged.next({url: "", isOnline: true});
        let peer: PeerInfo = res.body;
        // this.id = peer.id;
        // this.name = peer.name;
        this._dispatcher.login.next(peer);
        this.fetchPeersList();
      })
      .receive("error", (err) => {
        /*
          this._dispatcher.onNotifiableError.next({
            src: "server",
            message: err.reason
          });
        */
      });

    this._channel.on("chat_message", (body) => {
      this._dispatcher.receiveChatMessage.next(body);
    });

    this._channel.on("ring", (body) => {
      debug("ringing ..... ");
      debug(body);
      this._dispatcher.ringRequest.next(body);
    });

    this._channel.on("call", ({senderId, senderName, sdp, senderAgentId, receiverAgentId}) => {
      debug("Calling from ", senderName);
      if (typeof sdp === "string") {
        sdp = JSON.parse(sdp.replace(/\n/g, "\\r\\n"));
      }
      /*
      this._dispatcher.ringRequest.next({
        id: senderId,
        name: senderName,
        sdp: sdp,
        senderAgentId: senderAgentId,
        receiverAgentId: receiverAgentId
      });
     */
    });

    this._channel.on("answer", ({senderId, senderName, answer, senderAgentId, receiverAgentId}) => {
      debug("Response from ", senderName);
      if (typeof answer === "string") {
        answer = JSON.parse(answer.replace(/\n/g, "\\r\\n"));
      }
      /*
      this._dispatcher.ringResponse.next({
        id: senderId,
        name: senderName,
        sdp: answer,
        senderAgentId: senderAgentId,
        receiverAgentId: receiverAgentId
      });
     */
          // this.setAnswer(answer);
    });

    this._channel.on("sendIceCandidate", (payload: PackedCandidate) => {
      debug(payload);
      debug("Receive remote ICE Candidate", payload);
      this._dispatcher.sendIceCandidate.next(payload);
    });

  }

  public login(credential?: any): void {

  }

  public sendChatMessage(message: string) {
    this._channel.push("chat_message",  {
      content: message,
      from: {name: this.name, id: this._id},
      timestamp: (new Date()).toLocaleString()
    });
  }

  public sendOffer(senderAgentId: string, receiverAgentId: string, remoteId: number, sdp: string): void {
    if (!receiverAgentId) {
      sdp = JSON.stringify(sdp).replace(/\\r\\n/g, "\n");
    }
    this._channel.push("offer", {
      targetId: remoteId,
      sdp: sdp,
      senderAgentId: senderAgentId,
      receiverAgentId: receiverAgentId
    });
  }

  public sendIceCandidate(candidate: WarpCandidate): void {
    this._channel.push("sendIceCandidate", {
    });
  }

  public response(resp: WarpRingResponse): void {

  }

  public sendAnswer(senderAgentId: string, receiverAgentId: string, remoteId: number, sdp: string): void {
    if (!receiverAgentId) {
      sdp = JSON.stringify(sdp).replace(/\\r\\n/g, "\n");
    }
    this._channel.push("answer", {
      targetId: remoteId,
      answer: sdp,
      senderAgentId: senderAgentId,
      receiverAgentId: receiverAgentId
    });
  }

  public sendUpdatePeersListRequest() {

  }

  get dispatcher(): SignalingDispatcher {
    return this._dispatcher;
  }

  public closeConnection(): void {
    // TODO dispose all subscription and destroy peer, then peer should be reinstantiated.

    if (this._channel !== null) {
      this._channel.leave()
      .receive("ok", () => {
        debug("Channel Close Completed");
      })
      .receive("error", (reason) => {
        debug("Failed to close socket", reason);
      })
      .receive("timeout", () => {
        debug("Attempt to close Socket : timeout");
      })
      ;
    }
  }

  public ring(request: WarpRingRequest): void {
    this._channel.push("ring", request);
  }

  public fetchPeersList() {
    this._channel.push("peers_list", {})
      .receive("ok", this.updatePeersList.bind(this));
  }

  private updatePeersList({peers}) {
    debug("Fetched online peers list", peers);
    this._dispatcher.updatePeerList.next(peers.filter((peer) => { return peer.id !== this._id; }));
  }

}

/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Observable, Subject} from "rxjs";

import {Config} from "../Config";
import {SignalingAdapter} from "./SignalingAdapter";
import {SignalingDispatcher} from "../intent/SignalingDispatcher";
import {SignalingActionCreator} from "../intent/SignalingActionCreator";

import * as Debug from "debug";
const debug = Debug("warp:signaling:adapter");

export class SocketIoAdapter extends SignalingAdapter {

  private _socket: SocketIOClient.Socket;

  constructor(config: Config) {
    super();
    this._action = new SignalingActionCreator();
    this._dispatcher = this._action.dispatcher;
    this._config = config;
    this._socket = io(this._config.signalingServerURL);
    this._socket.on("connect", () => {
      debug("connected");
    });

    Observable.fromEvent<PeerInfo[]>(this._socket, "updatePeerList").subscribe(this._dispatcher.updatePeerList);
    Observable.fromEvent<PeerInfo>(this._socket, "login").subscribe(this._dispatcher.login);
    Observable.fromEvent<any>(this._socket, "public-chat").subscribe(this._dispatcher.receiveChatMessage);
    Observable.fromEvent<any>(this._socket, "ring").subscribe(this._dispatcher.ringRequest);
    Observable.fromEvent<any>(this._socket, "response").subscribe(this._dispatcher.ringResponse);
    Observable.fromEvent<any>(this._socket, "candidate").subscribe(this._dispatcher.receiveICECandidate);

    Observable.fromEvent<any>(this._socket, "connect").subscribe(this._dispatcher.connect);
    Observable.fromEvent<any>(this._socket, "disconnect").subscribe(this._dispatcher.disconnect);
    Observable.fromEvent<any>(this._socket, "reconnect").subscribe(this._dispatcher.reconnect);

    Observable.fromEvent<any>(this._socket, "reconnect_error").subscribe(this._dispatcher.connectionError);
    Observable.fromEvent<any>(this._socket, "reconnect_failed").subscribe(this._dispatcher.connectionError);
    Observable.fromEvent<any>(this._socket, "error").subscribe(this._dispatcher.connectionError);

    Observable.fromEvent<any>(this._socket, "authentication_error").subscribe(this._dispatcher.connectionError);

    this._socket.on("disconnect", () => {
      debug("disconnected");
    });
  }

  public login(credential?: any): void {
    this._socket.emit("login", {
      credential: credential ? credential : this._config["credential"],
      availableAgents: ["default"]
    });
  }

  public sendChatMessage(message: string) {
    this._socket.emit("public-chat", message);
  }

  public sendOffer(senderAgentId: string, receiverAgentId: string, remoteId: number, sdp: string): void {
    if (!receiverAgentId) {
      sdp = JSON.stringify(sdp).replace(/\\r\\n/g, "\n");
    }
  }

  public sendIceCandidate(candidate: WarpCandidate): void {
    this._socket.emit("candidate", candidate);
  }

  public response(resp: WarpRingResponse): void {
    this._socket.emit("response", resp);
  }

  public sendUpdatePeersListRequest() {
    this._socket.emit("peersList");
  }


  public closeConnection(): void {
    this._socket.close();
  }

  public ring(request: WarpRingRequest): void {
    this._socket.emit("ring", request);
  }

  public fetchPeersList() {
  }

  private updatePeersList({peers}) {
  }

}

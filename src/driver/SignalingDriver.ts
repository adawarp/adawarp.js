/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {SignalingActionCreator} from "../intent/SignalingActionCreator";
import {SignalingDispatcher} from "../intent/SignalingDispatcher";
import {RTCAgent} from "./RTCAgent";
import {Config} from "../Config";
import {SignalingAdapter} from "../adapter/SignalingAdapter";
// import {PhoenixAdapter} from "../adapter/PhoenixAdapter";
import {SocketIoAdapter} from "../adapter/SocketIoAdapter";

import * as Debug from "debug";
const debug = Debug("warp:signaling:driver");

class InvalidAdapterTypeError extends Error {

  public static UNSUPPORTED_TYPE: string = "Please provide a 'String', 'Uint8Array' or 'Array'.";

  constructor(public message: string) {
    super(message);
    this.name = "Invalid Adapter Type specified";
    this.stack = (<any> new Error()).stack;
  }
}

/**
 * SignalingDriver class is responcible for passing VALID peer data to adapter.
 *
 */

export class SignalingDriver {

  id: string;
  name: string;

  private _dispatcher: SignalingDispatcher;
  private _action: SignalingActionCreator;
  private _adapter: SignalingAdapter;

  constructor(config: Config, adapter?: SignalingAdapter) {
    if (adapter) {
      this._adapter = adapter;
    } else {
      switch (config.signalingServerType.toLowerCase()) {
        // case "phoenix":
        //   this._adapter = new PhoenixAdapter(config);
        //   break;
        case "socketio":
          this._adapter = new SocketIoAdapter(config);
          break;
        default:
          throw new InvalidAdapterTypeError(`config.signalingServerType specified invalid type : ${config.signalingServerType} `);
      }
    }

    this._dispatcher = this._adapter.dispatcher;
    this._dispatcher.login.subscribe((info: PeerInfo) => {
      debug(info);
      this.id = info.id;
      this.name = info.name;
    });
    this._dispatcher.connectionError.subscribe((error: any) => {
      console.error("signaling error", error);
    });
  }

  public login(): void {
    this._adapter.login();
  }

  public sendChatMessage(message: string) {
    this._adapter.sendChatMessage(message);
  }

  public sendIceCandidate(agentId: string, receiver: WarpAddress, candidate: RTCIceCandidate): void {
    this._adapter.sendIceCandidate({
      header: {
        receiver,
        sender: this.toAddress(agentId),
      },
      method: "candidate",
      body: { candidate }
    });
  }

  public sendAnswer(agentId: string, receiver: WarpAddress, sdp: string): void {
    this._adapter.response({
      header: {
        receiver,
        sender: this.toAddress(agentId),
      },
      method: "response",
      body: { sdp }
    });
  }

  public sendUpdatePeersListRequest() {

  }

  get dispatcher(): SignalingDispatcher {
    return this._dispatcher;
  }

  public closeConnection(): void {
    // TODO dispose all subscription and destroy peer, then peer should be reinstantiated.

  }

  public ring(agentId, receiver: WarpAddress, sdp: string): void {
    debug("ring to ", receiver);
    this._adapter.ring({
      header: {
        receiver,
        sender: this.toAddress(agentId),
      },
      method: "ring",
      body: { sdp }
    });
  }

  private toAddress(agentId: string): WarpAddress {
    return {
      id: this.id,
      name: this.name,
      agentId
    };
  }

  private fetchPeersList() {
  }

  private updatePeersList({peers}) {
  }
}

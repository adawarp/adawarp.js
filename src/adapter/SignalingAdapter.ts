/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Config} from "../Config";
import {SignalingDispatcher} from "../intent/SignalingDispatcher";
import {SignalingActionCreator} from "../intent/SignalingActionCreator";

/**
 * SignalingAdapter Abstract Class
 */

export abstract class SignalingAdapter {

  public _config: Config;
  public _id: string;
  public _uuid: string;
  public _action: SignalingActionCreator;
  public _dispatcher: SignalingDispatcher;

  abstract login(credential?: any): void;
  abstract sendChatMessage(message: string): void;
  abstract ring(request: WarpRingRequest): void;
  abstract response(response: WarpRingResponse): void;
  abstract sendIceCandidate(candidate: WarpCandidate): void;
  abstract closeConnection(): void;
  abstract fetchPeersList(): void;

  get dispatcher(): SignalingDispatcher {
    return this._dispatcher;
  }
}


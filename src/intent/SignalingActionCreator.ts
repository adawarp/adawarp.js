/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Subject} from "rxjs";

import {SignalingDispatcher} from "./SignalingDispatcher";

export class SignalingActionCreator {

  private _dispatcher: SignalingDispatcher;

  constructor() {
    this._dispatcher = new SignalingDispatcher();
  }

  get dispatcher(): SignalingDispatcher {
    return this._dispatcher;
  }

}


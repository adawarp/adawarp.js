/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Subject} from "rxjs";

import {RTCDispatcher} from "./RTCDispatcher";

export class RTCActionCreator {

  private _dispatcher: RTCDispatcher;

  constructor() {
    this._dispatcher = new RTCDispatcher();
  }

  get dispatcher(): RTCDispatcher {
    return this._dispatcher;
  }

}


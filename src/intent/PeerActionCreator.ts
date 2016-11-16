/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Subject} from "rxjs";

import {PeerDispatcher} from "./PeerDispatcher";

export class PeerActionCreator {

  private _dispatcher: PeerDispatcher;

  constructor() {
    this._dispatcher = new PeerDispatcher();
  }

  get dispatcher(): PeerDispatcher {
    return this._dispatcher;
  }
}


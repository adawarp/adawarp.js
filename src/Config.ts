/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import * as Rx from "rxjs";
import * as Debug from "debug";

import dispatcher from "./intent/Dispatcher";

const debug = Debug("decot:config");

export class Config {

  signalingServerURL: string;
  iceServers: any;
  loaded: boolean = false;
  allowToReceiveCallFromAnyone: boolean = false;
  uuid: string;
  signalingServerType: string;
  credential: any;

  constructor(config: any) {
    this.credential = {};
    this.iceServers =
      [
        {urls: "stun:stun.l.google.com:19302"},
        {urls: "stun:stun1.l.google.com:19302"},
        {urls: "stun:stun2.l.google.com:19302"},
        {urls: "stun:stun3.l.google.com:19302"},
        {urls: "stun:stun4.l.google.com:19302"}
      ];
    this.signalingServerURL = "wss://adawarp-simple-server.herokuapp.com";
    this.signalingServerType = "socketio";

    if (config) {
      Object.assign(this, config);
      this.loaded = true;
    }

    dispatcher.onConfigChanged.subscribe(({key, value}) => {
      if (["allowToReceiveCallFromAnyone"].indexOf(key) !== -1 ) {
        this[key] = value;
      } else {
        debug("Invalid Configuration key inserted", key, value);
      }
    });
  }

  public loadFromJSON(configRaw: string): boolean {
    try {
      let conf = JSON.parse(configRaw);
      console.log(conf);
      this.signalingServerURL = conf.signalingServerURL;
      this.iceServers = conf.iceServers;
      Object.assign(this, conf);
      return true;
    } catch (e) {
      return false;
    }
  }

  public load(config: any): void {
    try {
      Object.assign(this, config);
      this.loaded = true;
    } catch (e) {
      console.error(e);
    }
  }

  private validate(): boolean {
    return true;
  }
}

/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Subject} from "rxjs";

import {RTCAgent} from "../driver/RTCAgent";

export class RTCDispatcher {

  dataChannelOpen: Subject<any>;
  dataChannelClose: Subject<any>;
  dataChannelMessage: Subject<any>;
  track: Subject<any>;
  removeStream: Subject<any>;
  close: Subject<RTCAgent>;

  connectionError: Subject<any>;

  // PeerJS ComaptiBle API
  open: Subject<any>;
  call: Subject<any>;
  data: Subject<any>;
  stream: Subject<any>;

  constructor() {
    this.dataChannelOpen = new Subject<any>();
    this.dataChannelClose = new Subject<any>();
    this.dataChannelMessage = new Subject<any>();
    this.track= new Subject<any>();
    this.removeStream = new Subject<any>();
    this.close = new Subject<RTCAgent>();
    this.connectionError = new Subject<any>();

    // PeerJS Comaptible API
    this.open = new Subject<any>();
    this.call = new Subject<any>();
    this.data= new Subject<any>();
    this.stream = new Subject<any>();
  }
}

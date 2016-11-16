/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Observable, Subject} from "rxjs";

import {RTCAgent} from "../driver/RTCAgent";

export class PeerDispatcher {

  login: Subject<PeerInfo>;
  updatePeerList: Subject<any>;
  serverStatusChanged: Subject<ServerConnectionStatus>;
  receiveChatMessage: Subject<any>;
  ringRequest: Subject<WarpRingRequest>;
  ringResponse: Subject<WarpRingResponse>;
  receiveICECandidate: Subject<WarpCandidate>;

  connectionStateChange: Subject<any>;
  close: Subject<RTCAgent>;
  addStream: Subject<any>;

  signalingServerError: Subject<any>;
  data: Subject<any>;
  error: Subject<any>;

  // PeerJS ComaptiBle API
  open: Subject<any>;
  call: Subject<any>;
  connection: Subject<RTCAgent>;

  constructor() {

    this.login = new Subject<PeerInfo>();
    this.updatePeerList = new Subject<any>();
    this.serverStatusChanged = new Subject<ServerConnectionStatus>();
    this.receiveChatMessage = new Subject<any>();
    this.ringRequest = new Subject<WarpRingRequest>();
    this.ringResponse = new Subject<WarpRingResponse>();
    this.receiveICECandidate = new Subject<WarpCandidate>();
    this.connectionStateChange = new Subject<any>();
    this.close = new Subject<RTCAgent>();

    this.addStream = new Subject<any>();
    this.signalingServerError = new Subject<any>();
    this.data = new Subject<any>();

    this.error = new Subject<any>();

    // PeerJS Comaptible API
    this.open = new Subject<any>();
    this.call = new Subject<any>();
    this.connection = new Subject<RTCAgent>();
  }

}


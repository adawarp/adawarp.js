/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Subject} from "rxjs";

export class SignalingDispatcher {

  login: Subject<PeerInfo>;
  updatePeerList: Subject<PeerInfo[]>;
  serverStatusChanged: Subject<ServerConnectionStatus>;
  receiveChatMessage: Subject<any>;

  ringRequest: Subject<WarpRingRequest>;
  ringResponse: Subject<WarpRingResponse>;
  sendIceCandidate: Subject<PackedCandidate>;
  receiveICECandidate: Subject<WarpCandidate>;

  connect: Subject<any>;
  disconnect: Subject<any>;
  reconnect: Subject<any>;
  connectionError: Subject<any>;

  constructor() {

    this.login = new Subject<PeerInfo>();
    this.updatePeerList = new Subject<PeerInfo[]>();
    this.serverStatusChanged = new Subject<ServerConnectionStatus>();
    this.receiveChatMessage = new Subject<any>();

    this.ringRequest = new Subject<WarpRingRequest>();
    this.ringResponse = new Subject<WarpRingResponse>();
    this.sendIceCandidate = new Subject<PackedCandidate>(); // deprecated
    this.receiveICECandidate = new Subject<WarpCandidate>();

    this.connect = new Subject<any>();
    this.disconnect = new Subject<any>();
    this.reconnect = new Subject<any>();
    this.connectionError = new Subject<any>();
  }

}


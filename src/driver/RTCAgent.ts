/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Subscription, Subject} from "rxjs";
import * as Debug from "debug";

import {RTCActionCreator} from "../intent/RTCActionCreator";
import {RTCDispatcher} from "../intent/RTCDispatcher";
import {SignalingDriver} from "./SignalingDriver";
const debug = Debug("warp:rtc");
const debugDC = Debug("warp:rtc:dc");


export class RTCAgent {

  remote: WarpAddress;
  dataChannel: RTCDataChannel;
  stream: MediaStream;
  signalingServer: SignalingDriver;
  answer: (stream: MediaStream) => any;

  private _peer: RTCPeerConnection;
  private _agentId: string;
  private _dispatcher: RTCDispatcher;
  private _action: RTCActionCreator;
  private _config: any;
  private _subscription: Subscription;

  constructor(signalingServer: SignalingDriver, config: any, agentId: string) {

    this._subscription = new Subscription();
    this._agentId = agentId;
    this._action = new RTCActionCreator();
    this._dispatcher = this._action.dispatcher;
    this._config = config;

    this.signalingServer = signalingServer;
    this.stream = null;
    this._peer = null;
    this.dataChannel = null;

  }

  get peer(): string {
    return this.remote.id;
  }

  private init() {
    this._peer = this.initRTCPeerConnection(this._config);
    if (this.stream) {
      this._peer.addStream(this.stream);
    }
    this._peer.onicecandidate = this.sendIceCandidateFromEvent.bind(this);
    this._peer.onnegotiationneeded = this.debugConnectionStateFromEvent.bind(this);
    this._peer.onsignalingstatechange = this.debugConnectionStateFromEvent.bind(this);
    this._peer.oniceconnectionstatechange = this.debugConnectionStateFromEvent.bind(this);
    this._peer.onstatechange = this.debugConnectionStateFromEvent.bind(this);
    this._peer.onidentityresult = (e) => { debug("Identity Result ", e); };
    this._peer.onconnecting = (e) => { debug("Connecting ", e); };
    window.onbeforeunload = (e) => {
      this.closeConnection();
    };

    this._peer.onaddstream = (streamEvent: RTCMediaStreamEvent) => {
      debug(this._agentId, "receive stream ======================");
      this._dispatcher.stream.next(streamEvent.stream);
      this._dispatcher.track.next({
        stream: streamEvent.stream,
        receiverAgentId: this._agentId,
        senderAgentId: this.remote.agentId
      });
    };
    this._peer.onremovestream = (e) => { debug("stream removed"); };
  }

  public on(eventName: string, callback: (args: any) => any): void {
    debug(eventName);
    if (this._dispatcher.hasOwnProperty(eventName)) {
      debug(`register callback: ${eventName}`);
      this._subscription.add(this._dispatcher[eventName].subscribe(callback));
    } else {
      console.error(`event: ${eventName} does not exist`);
    }
  }


  get dispatcher(): RTCDispatcher {
    return this._dispatcher;
  }

  get id(): string {
    return this._agentId;
  }

  public closeConnection(): void {
    // TODO dispose all subscription and destroy peer, then peer should be reinstantiated.
    if (this.dataChannel.readyState === "open") {
      this.dataChannel.send("Closing Connection...");
    }
    this.dataChannel.close();
    if (this._peer.signalingState !== "closed") {
      this._peer.close();
    }

    this._dispatcher.close.next(this);
  }

  private initRTCPeerConnection(config: any): RTCPeerConnection {
    if ("webkitRTCPeerConnection" in window) {
      return new webkitRTCPeerConnection(config);
    }

    if ("RTCPeerConnection" in window) {
      return new RTCPeerConnection(config, null);
    }
  }

  private initDataChannel(channel?: RTCDataChannel) {
    this.dataChannel = channel || this._peer.createDataChannel("default");
    this.dataChannel.onopen = (e) => {
      debug("DC Open");
      this._dispatcher.dataChannelOpen.next(e);
      this._dispatcher.open.next(e);
    };

    this.dataChannel.onclose = (e) => {
      this._dispatcher.dataChannelClose.next(e);
      debug("DC close");
      this.closeConnection();
    };

    this.dataChannel.onmessage = (msg) => {
      this._dispatcher.dataChannelMessage.next(msg);
      this._dispatcher.data.next(msg.data);
      debugDC(msg);
    };

  }

  private debugConnectionStateFromEvent(event): void {
    const state = {
      iceConnectionState: event.target.iceConnectionState,
      iceGatheringState: event.target.iceGatheringState,
      idpLoginUrl:  event.target.idpLoginUrl,
      canTrickleIceCandidates: event.target.canTrickleIceCandidates,
      signalingState: event.target.signalingState,
      type: event.type,
      timeStamp: event.timeStamp
    };

    // this.onConnectionStateChange.next(event);
    debug(this._agentId, "connection state change", state);
  }

  public ring(receiver: WarpAddress): void {

    debug(this._agentId, "create offer");
    // setup RTCPeerConnection
    this.init();
    this.initDataChannel();
    this.remote = receiver;

    this._peer.createOffer((sdp: string) => {
      this._peer.setLocalDescription(sdp);
      this.signalingServer.ring(this._agentId, receiver, sdp);
    }, (err) => {
      debug(this._agentId, "Failed to create offer", err);
    });
  }


  public setOffer(sdp: RTCSessionDescriptionInit): void {

    debug(this._agentId, "set remote offer");
    // setup RTCPeerConnection
    this.init();
    this._peer.ondatachannel = (e) => { this.initDataChannel(e["channel"]); };
    this._peer.setRemoteDescription(
      new RTCSessionDescription(sdp),
      this.createAnswer.bind(this),
      function(err){
        debug(err, "err");
      }
    );
  }

  public setAnswer(sdp: RTCSessionDescriptionInit): void  {
    debug(this._agentId, "set remote anser");
    this._peer.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  private sendIceCandidateTo(candidate: RTCIceCandidate): void {
    debug(this._agentId, "Send ICE candidate :", this.remote);
    this.signalingServer.sendIceCandidate(this._agentId, this.remote, candidate);
  }

  private sendIceCandidateFromEvent(event ): void {
      if (!this.remote.id) {
        debug(this._agentId, "Missing RemotePeer Information", this);
        // TODO: throw error
        return undefined;
      }
      if (event.candidate) {
          this.sendIceCandidateTo(event.candidate);
      } else {
        debug(this._agentId, "End of candidates. ------------------- phase=" + event.eventPhase);
      }
  }


  private createAnswer(): void {
    debug(this._agentId, "create answer ============== ");
    debug(`${this._agentId} => ${this.remote}`);
    this._peer.createAnswer((sdp: string) => {
      this._peer.setLocalDescription(sdp);
      this.signalingServer.sendAnswer(this._agentId, this.remote, sdp);
    },

    (err) => {
      debug("Failed to create answer", err);
    });
  }

  public setRemoteCandidate(candidateString: RTCIceCandidateInit): void {
    const candidate: RTCIceCandidate = new RTCIceCandidate(candidateString);
    debug("Received Candidate: ", candidate);
    this._peer.addIceCandidate(candidate, () => {}, () => {});
  }

  // PeerJS Comaptible APIs
  
  public send(data: any): void {
    this.dataChannel.send(data);
  }

  public close(): void {
    this.closeConnection();
  }

}

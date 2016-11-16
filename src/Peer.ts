/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Subscription, Observable} from "rxjs";
import * as Debug from "debug";
import * as io from "socket.io-client";

import dispatcher from "./intent/Dispatcher";
import {PeerDispatcher} from "./intent/PeerDispatcher";
import {PeerActionCreator as PeerAction} from "./intent/PeerActionCreator";
import {RTCAgent} from "./driver/RTCAgent";
import {SignalingDriver} from "./driver/SignalingDriver";
import {Config} from "./Config";

const debug = Debug("warp:peer");
const debugPeer = Debug("warp:PeerJSCompatiAPI");

/**
 *  Peer class is the interface of RTCPeerConnection and communication with 
 *  Signaling server. This is responsible for UserMedia, Signaling and managing 
 *  lifetime of many RTCAgent(agent). It is important to be NOT responsible for
 *  generating agent. 
 */

export class Peer {

  config: Config;
  constraints: MediaStreamConstraints;
  id: string;
  name: string;

  private _agents: { [key: string]: RTCAgent };
  private _signalingServer: SignalingDriver;
  private _action: PeerAction;
  private _dispatcher: PeerDispatcher;
  private _subscription: Subscription;
  private _defaultAgent: RTCAgent;
  public info: PeerInfo;

  constructor(configuration: any) {
    debug("init peer");

    this.config = new Config(configuration);
    this.id = null;
    this.name = null;
    this._signalingServer = new SignalingDriver(this.config);
    this._agents = {};

    this._action = new PeerAction();
    this._dispatcher = this._action.dispatcher;

    this._subscription = new Subscription();

    this._subscription.add(this._signalingServer.dispatcher.login.subscribe(this._dispatcher.login));
    this._subscription.add(this._signalingServer.dispatcher.login.subscribe((info) => { this.info = info; this.id = info.id; }));
    this._subscription.add(this._signalingServer.dispatcher.updatePeerList.subscribe(this._dispatcher.updatePeerList));
    this._subscription.add(this._signalingServer.dispatcher.ringRequest.subscribe(this._dispatcher.ringRequest));
    this._subscription.add(this._signalingServer.dispatcher.ringResponse.subscribe(this._dispatcher.ringResponse));
    this._subscription.add(this._signalingServer.dispatcher.receiveICECandidate.subscribe(this._dispatcher.receiveICECandidate));
    this._subscription.add(this._signalingServer.dispatcher.connectionError.subscribe(this._dispatcher.signalingServerError));
    this._subscription.add(this._signalingServer.dispatcher.receiveChatMessage.subscribe(this._dispatcher.receiveChatMessage));

    this._subscription.add(this._signalingServer.dispatcher.disconnect.subscribe(() => {
      this._dispatcher.connectionStateChange.next({type: "disconnect"});
    }));
    this._subscription.add(this._signalingServer.dispatcher.reconnect.subscribe((n) => {
      this._dispatcher.connectionStateChange.next({type: "reconnect", attepts: n});
    }));
    this._subscription.add(this._signalingServer.dispatcher.connect.subscribe(() => {
      this._dispatcher.connectionStateChange.next({type: "connect"});
    }));

    this._subscription.add(this._dispatcher.ringRequest.subscribe((req: WarpRingRequest) => {
      this.setOffer(req);
    }));

    this._subscription.add(this._dispatcher.ringResponse.subscribe((req: WarpRingResponse) => {
      this.setAnswer(req);
    }));

    this._subscription.add(this._dispatcher.receiveICECandidate.subscribe((candidate: WarpCandidate) => {
      this.setCandidate(candidate);
    }));

    // PeerJS Comaptible API
    this._subscription.add(this._signalingServer.dispatcher.login.subscribe(this._dispatcher.open));
    this._subscription.add(this._signalingServer.dispatcher.ringRequest.subscribe((request: WarpRingRequest) => {
      const agent = this.getAgentByRequest(request);
      agent.answer = (stream: MediaStream) => {
        agent.remote = request.header.sender;
        agent.stream = stream;
        agent.setOffer(request.body.sdp);
      };
      this._dispatcher.call.next(agent);
    }));

    this.addAgent("default");
    this._defaultAgent = this.getAgent("default");
    this._subscription.add(this._defaultAgent.dispatcher.dataChannelMessage.subscribe((message) => { this._dispatcher.data.next(message.data); }));
  }

  public login(): void {
    debug("atempt to login");
    this._signalingServer.login();
  }

  public send(args: any): void {
    this._defaultAgent.dataChannel.send( typeof args === "object" ? JSON.stringify(args) : args);
  }

  get dispatcher(): PeerDispatcher {
    return this._dispatcher;
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

  public dispose(): void {
    this._subscription.unsubscribe();
  }

  public fetchAgentsList() {

  }

  public sendChatMessage(message: string): void {
    this._signalingServer.sendChatMessage(message);
  }

  /**
   * call remote peer by id. 
   * @param remoteId remote peer id which you want to call
   * @param agentId specified sender agent id.
   * @return 
   */

  public ring(remoteId: string, agentId = "default"): void {
    debug(`ring to remoteid: ${remoteId}, agentId: ${agentId}`);

    if (!this._agents.hasOwnProperty(agentId)) {
      return undefined;
    }
    let agent: RTCAgent = this.getAgent(agentId);
    agent.ring({id: remoteId, agentId});
  }

  public addAgent(agentId: string): void {
    if (this._agents.hasOwnProperty(agentId)) {
      // XXX Error
      console.error(`${agentId} has already registered`);
      return;
    }
    let agent = new RTCAgent(this._signalingServer, this.config, agentId);
    agent.dispatcher.close.subscribe(this._dispatcher.close);
    agent.dispatcher.connectionError.subscribe((target: any) => {
      if (target.iceConnectionStateChange === "failed") {
        this._dispatcher.error.next({
          type: "iceConnectionFailed",
          target 
        });
      }
    });
    agent.dispatcher.dataChannelOpen.subscribe((event: any) => {
      this._dispatcher.connection.next(agent);
    });
    this._agents[agentId] = agent;
  }

  private setOffer(req: WarpRingRequest): void {
    let agent: RTCAgent = this.getAgentByRequest(req);
    agent.remote = req.header.sender;
    agent.setOffer(req.body.sdp);

  }

  private getAgentByRequest(req: WarpMessage): RTCAgent {
    if (req.header.receiver["agentId"]) {
      return this._agents[req.header.receiver.agentId];
    }

    // XXX throw error
    return null;
  }

  public getAgent(id: string): RTCAgent {
    if (this._agents.hasOwnProperty(id)) {
      return this._agents[id];
    } else {
      return null;
    }
  }

  private setAnswer(req: WarpRingResponse): void {
    let agent: RTCAgent = this.getAgentByRequest(req);
    agent.remote = req.header.sender;
    agent.setAnswer(req.body.sdp);
  }

  private setCandidate(packet: WarpCandidate): void {
    let agent: RTCAgent = this.getAgentByRequest(packet);
    agent.remote = packet.header.sender;
    agent.setRemoteCandidate(packet.body.candidate);
  }

  /**
   * close all connection and remove all subscription of the agent, then remove agent.
   * @param agentId Id of agent that will be removed.
   * @return there is nothing to return.
   */

  private removeAgent(agentId: string) {

  }

  // PeerJS Comaptible APIs
  
  public connect(remoteId: string, agentId = "default"): RTCAgent {
    debugPeer(`connect to ${remoteId}`);

    if (!this._agents.hasOwnProperty(agentId)) {
      return undefined;
    }
    let agent: RTCAgent = this.getAgent(agentId);
    agent.ring({id: remoteId, agentId});
    return agent;
  }

  public call(remoteId: string, stream: MediaStream): RTCAgent {
    debugPeer(`connect to ${remoteId}`);
    const agentId = "default";
    if (!this._agents.hasOwnProperty(agentId)) {
      return undefined;
    }
    let agent: RTCAgent = this.getAgent(agentId);
    agent.stream = stream;
    agent.ring({id: remoteId, agentId});
    return agent;
  }
}

global["Adawarp"] = Peer;

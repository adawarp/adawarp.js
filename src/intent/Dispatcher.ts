/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import {Subject} from "rxjs";
import {RTCAgent} from "../driver/RTCAgent";

const Dispatcher: {

  onLogin: Subject<PeerInfo>;
  onServerStatusChanged: Subject<ServerConnectionStatus>;
  onStreamAdd: Subject<any>;
  onLocalStreamAdd: Subject<any>;
  onMediaDeviceCollected: Subject<any>;
  onMediaDeviceSelected: Subject<any>;

  onReceiveChatMessage: Subject<any>;
  onSendChatMessageRequest: Subject<string>;

  onNotifiableError: Subject<ErrorMessage>;
  onConfigChanged: Subject<any>;

  onCreatePlayer: Subject<RTCAgent>;
  onDeletePlayer: Subject<RTCAgent>;

} = {

  onLogin: new Subject<PeerInfo>(),
  onServerStatusChanged: new Subject<ServerConnectionStatus>(),
  onStreamAdd: new Subject(),
  onLocalStreamAdd: new Subject(),
  onMediaDeviceCollected: new Subject<any>(),
  onMediaDeviceSelected: new Subject<any>(),

  onReceiveChatMessage: new Subject<any>(),
  onSendChatMessageRequest: new Subject<string>(),

  onNotifiableError: new Subject<ErrorMessage>(),
  onConfigChanged: new Subject<any>(),

  onCreatePlayer: new Subject<RTCAgent>(),
  onDeletePlayer: new Subject<RTCAgent>()
};

export default Dispatcher;

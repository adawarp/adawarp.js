/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

interface PeerInfo {
  id: string;
  name: string;
  screen_name?: string;
  agents?: {
    [index: string]: string;
  }
}

interface WarpAddress {
  id: string;
  agentId?: string;
  name?: string;
}

interface WarpHeader {
  sender: WarpAddress;
  receiver: WarpAddress;
}

interface WarpMessage {
  header: WarpHeader;
  method: string;
  body?: any;
}

interface WarpRingRequest {
  header: WarpHeader;
  method: "ring";
  body: any;
}

// including offer
interface WarpRingAcceptResponse {
  header: WarpHeader;
  method: "ring-accept";
  body: {
    sdp: RTCSessionDescriptionInit;
  };
}

interface WarpRingRejectResponse {
  header: WarpHeader;
  method: "ring-reject";
  body?: any;
}

type WarpRingResponse = WarpRingAcceptResponse | WarpRingRejectResponse | WarpMessage;

interface WarpCandidate {
  header: WarpHeader;
  method: "candidate";
  body: {
    candidate: any;  
  };
}


interface PackedCandidate {
  id: string;
  senderId?: string;
  senderAgentId: string;
  receiverAgentId: string;
  candidate: RTCIceCandidateInit;
}

interface ServerConnectionStatus {
  url: string;
  isOnline: boolean;
}

interface ChatMessage {
  content: string;
  from: {
    name: string;
    id: string;
  };
  timestamp: string;
}

interface ErrorMessage {
  src: string;
  message: string;
}

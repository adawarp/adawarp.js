/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import * as Rx from "rxjs";
import * as Debug from "debug";

import dispatcher from "./intent/Dispatcher";

const debug = Debug("decot:media");

class Media {

  audioInputs: Array<any>;
  audioOutputs: Array<any>;
  videoInputs: Array<any>;
  constraints: any = {
    video: true,
    audio: true
  };
  stream: any = null;

  constructor() {
    dispatcher.onMediaDeviceSelected.subscribe((device) => {
      debug(`${device.kind} Device selected ${device.id} `);
      this.constraints[device.kind] = {
        deviceId: device.id ? {exact: device.id} : undefined,
      };

      this.constraints.video = Object.assign(this.constraints.video, {
        width: {exact: 320},
        height: {exact: 240}
      });
      this.initDevice();
      this.search();
    });
  }

  public search(): Promise<any> {
    debug("search media devices");

    return navigator.mediaDevices.enumerateDevices()
    .then(this.gotDevices.bind(this))
    .catch(this.handleError.bind(this));
  }

  public setDefaultDevice() {

    dispatcher.onMediaDeviceSelected.next({
      id: this.audioInputs[0].deviceId,
      kind: "audio"
    });
    dispatcher.onMediaDeviceSelected.next({
      id: this.videoInputs[0].deviceId,
      kind: "video"
    });

    this.initDevice();
    this.search();
  }

  private gotDevices(deviceInfos): void {
    debug("got devices");
    this.audioInputs = [];
    this.audioOutputs = [];
    this.videoInputs = [];

    for (let i = 0; i < deviceInfos.length; i++) {
      let deviceInfo = deviceInfos[i];
      if (deviceInfo.kind === "audiooutput") {
        this.audioOutputs.push(deviceInfo);
      } else if (deviceInfo.kind === "audioinput") {
        this.audioInputs.push(deviceInfo);
      } else if (deviceInfo.kind === "videoinput") {
        this.videoInputs.push(deviceInfo);
      } else {
        debug("Illigal device type");
      }
    }

    dispatcher.onMediaDeviceCollected.next({
      video: this.videoInputs,
      audio: this.audioInputs
    });
  }

  private handleError(): void {

  }

  private initDevice() {

    if (this.stream) {
      this.stream.getTracks().forEach(function(track) {
        track.stop();
      });
    }
    debug("init as ", this.constraints);

    if ("webkitGetUserMedia" in navigator) {

      let constraints = {
        video: {
          optional: [{
            sourceId: this.constraints.video.deviceId.exact
          }]
        },
        audio: true
      };
      debug("make constraints webkit-style => ", constraints);
      navigator.webkitGetUserMedia(constraints, (stream) => {
        debug("fetch stream");
        this.stream = stream;
        dispatcher.onLocalStreamAdd.next(stream);
      }, (error) => {
        debug("getUserMedia Error", error);
      });

    } else if ("mediaDevices" in navigator) {

      navigator.mediaDevices.getUserMedia(this.constraints)
      .then((stream) => {
        debug("fetch stream");
        this.stream = stream;
        return dispatcher.onLocalStreamAdd.next(stream);
      });

    } else {
      alert("Cannot use Media Device");
    }

  }

}

const media = new Media();
export default media

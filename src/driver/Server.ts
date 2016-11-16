/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import * as axios from "axios";

export class ServerDriver {

  private baseURL: string = "https://telp.horol.org";

  constructor() {

  }

  public registerDevice(name: string, screenName: string, userAgent?: string) {
    return axios.post("/api/v1/device/", {
      device: {
        name: name,
        screen_name: screenName,
        user_agent: userAgent || navigator.userAgent
      }
    }, {
      baseURL: this.baseURL,
      headers: {
        "Content-type": "application/json",
        "Accept": "application/json"
      }
    });
  }
}



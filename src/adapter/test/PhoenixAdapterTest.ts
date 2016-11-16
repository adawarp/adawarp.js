/* vim: set ft=typescript expandtab sw=2 sts=2 ff=unix fenc=utf-8 : */

import assert from "power-assert";
import {PhoenixAdapter} from "../PhoenixAdapter";
import {Config} from "../../Config";

global["window"] = {
  Socket: function() { console.log("hello websocket"); },
  XMLHttpRequest: function() {
    return {
      timeout: null,
      open: function() { console.log("open"); },
      setRequestHeader: function() { console.log("setRequestHeader"); },
      send: function() { console.log("send"); }
    };
  }
};

const config = new Config({
  uuid: "01231312",
  signalingServerURL: "http://localhost:3333",
  signalingServerType: "socketio",
});

describe("Phoenix Adapter", () => {
  it("should have a config", () => {
    let adapter = new PhoenixAdapter(config);
    assert.equal(adapter._uuid, config.uuid );
  });
});

async function shimAlwaysAsk(name) {
  try {
    const status = await window.navigator.permissions.query({name});
    const lastState = status.state;
    status.onchange = () => {
      switch (status.state) {
        case "granted":
          window.localStorage[`queryShim_${name}_alwaysAsk`] = true;
          break;
        case "denied":
          delete window.localStorage[`queryShim_${name}_alwaysAsk`];
          break;
        case "prompt":
          if (lastState == "granted") {
            delete window.localStorage[`queryShim_${name}_alwaysAsk`];
          }
          break;
      }
      lastState = status.state;
    };
    status.onchange();
  } catch (e) {}
}
shimAlwaysAsk("camera");
shimAlwaysAsk("microphone");
shimPermissionNameMap = {
  camera: "camera",
  microphone: "microphone",
  video_capture: "camera",
  audio_capture: "microphone",
};

const originalGetter = Object.getOwnPropertyDescriptor(PermissionStatus.prototype, 'state').get;

Object.defineProperty(PermissionStatus.prototype, 'state', {
  get: function() {
    const name = shimPermissionNameMap[this.name];
    if (name != "camera" && name != "microphone") {
      return originalGetter.call(this);
    }
    const state = originalGetter.call(this);
    return (state == "prompt" &&
            window.localStorage[`queryShim_${name}_alwaysAsk`])? "always-ask" : state;
  }
});

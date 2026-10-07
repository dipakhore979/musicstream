// One <audio> element for the whole app. It lives outside React so it is never unmounted
// when pages change, which is what keeps music playing while you navigate.
export const audio = new Audio();
audio.preload = "auto";

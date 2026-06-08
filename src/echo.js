import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_KEY,
  wsHost: import.meta.env.VITE_WS_HOST,
  wsPort: Number(import.meta.env.VITE_WS_PORT),
  forceTLS: false,
  disableStats: true,
});

export default echo;

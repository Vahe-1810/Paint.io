import { io } from "socket.io-client";

const URL = "http://10.0.0.18:3000";

export const socket = io(URL, {
  autoConnect: false,
});

import { io } from "socket.io-client";

const SERVER_URL = "http://192.168.0.9:3000";

const socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

export { SERVER_URL };
export default socket;

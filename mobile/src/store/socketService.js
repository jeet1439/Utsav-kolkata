import { io } from "socket.io-client";

const SERVER_URL = "http://10.30.75.63:3000";

const socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

export { SERVER_URL };
export default socket;

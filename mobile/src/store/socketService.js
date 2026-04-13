import { io } from "socket.io-client";
import { BASE_URL as SERVER_URL } from "../constants/api";

const socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: true,
});

export { SERVER_URL };
export default socket;

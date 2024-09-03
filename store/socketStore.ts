import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { apiConfig } from "@/config/apiConfig";

interface SocketStoreState {
  socket: Socket;
}

export const socketStore = create<SocketStoreState>((set) => ({
  socket: io(apiConfig.API_URL),
}));

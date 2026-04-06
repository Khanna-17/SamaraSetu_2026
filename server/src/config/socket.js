import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL?.split(",") || ["http://localhost:5173"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-admin-room", () => {
      socket.join("admin-room");
    });

    socket.on("join-leaderboard-room", () => {
      socket.join("leaderboard-room");
    });
  });
}

export function getIo() {
  return io;
}

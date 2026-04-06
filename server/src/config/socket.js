import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

function isAdminToken(token) {
  if (!token || !process.env.JWT_SECRET) {
    return false;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL?.split(",") || ["http://localhost:5173"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-admin-room", (token, callback) => {
      if (!isAdminToken(token)) {
        callback?.({ ok: false, message: "Unauthorized" });
        return;
      }

      socket.join("admin-room");
      callback?.({ ok: true });
    });

    socket.on("join-leaderboard-room", () => {
      socket.join("leaderboard-room");
    });
  });
}

export function getIo() {
  return io;
}

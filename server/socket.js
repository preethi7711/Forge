import { Server as SocketIOServer } from "socket.io";

let io = null;
const userSockets = new Map(); // userId -> socketIds

export function initSocket(server) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // Register connected user to their ID
    socket.on("register", (userId) => {
      socket.data.userId = userId;
      const sockets = userSockets.get(userId) || [];
      if (!sockets.includes(socket.id)) {
        sockets.push(socket.id);
      }
      userSockets.set(userId, sockets);
    });

    // Join room for an accountability circle
    socket.on("join-circle", (circleId) => {
      socket.join(`circle-${circleId}`);
    });

    // Leave accountability circle room
    socket.on("leave-circle", (circleId) => {
      socket.leave(`circle-${circleId}`);
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId) {
        const sockets = userSockets.get(userId) || [];
        const index = sockets.indexOf(socket.id);
        if (index !== -1) {
          sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
          userSockets.delete(userId);
        } else {
          userSockets.set(userId, sockets);
        }
      }
    });
  });

  return io;
}

// Push notification in real-time to a connected user
export function notifyUser(userId, data) {
  if (!io) return;
  const sockets = userSockets.get(userId) || [];
  sockets.forEach((socketId) => {
    io?.to(socketId).emit("notification", data);
  });
}

// Broadcast chat message to a circle
export function broadcastCircleMessage(circleId, message) {
  if (!io) return;
  io.to(`circle-${circleId}`).emit("circle-message", message);
}

// Broadcast system-wide or friends' celebration
export function broadcastCelebration(data) {
  if (!io) return;
  io.emit("celebration-broadcast", data);
}

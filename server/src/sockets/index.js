import { verifyAuthToken } from '../utils/verifyAuthToken.js';
import { ROLES } from '../constants/roles.js';

let ioInstance = null;

// A ref field may be a raw ObjectId or, after `.populate()`, a full object -
// always resolve to its id string before using it as a room name.
function toIdString(value) {
  return (value?._id ?? value).toString();
}

async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      next(new Error('Not authorized, no token provided'));
      return;
    }
    socket.user = await verifyAuthToken(token);
    next();
  } catch {
    next(new Error('Not authorized, invalid or expired token'));
  }
}

export function registerSocketHandlers(io) {
  ioInstance = io;

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(userId);
    if (socket.user.role === ROLES.ADMIN) {
      socket.join('admins');
    }

    console.log(`Socket connected: ${socket.id} (user ${userId})`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (user ${userId})`);
    });
  });
}

export function getIO() {
  return ioInstance;
}

export function emitNotificationCreated(notification) {
  const io = getIO();
  if (!io) return;
  io.to(toIdString(notification.user)).emit('notification:new', notification);
}

export function emitComplaintUpdated(complaint) {
  const io = getIO();
  if (!io) return;

  const rooms = new Set(['admins']);
  if (complaint.createdBy) rooms.add(toIdString(complaint.createdBy));
  if (complaint.assignedTo) rooms.add(toIdString(complaint.assignedTo));

  io.to([...rooms]).emit('complaint:updated', { complaintId: complaint._id.toString() });
}

export function emitDashboardUpdate() {
  const io = getIO();
  if (!io) return;
  io.to('admins').emit('dashboard:update');
}

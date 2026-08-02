import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import app from '../src/app.js';
import { registerSocketHandlers } from '../src/sockets/index.js';
import { ROLES } from '../src/constants/roles.js';
import { createUser } from './helpers/factories.js';
import { generateToken } from '../src/utils/generateToken.js';
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db.js';

let httpServer;
let socketUrl;

beforeAll(async () => {
  await connectTestDB();

  httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });
  registerSocketHandlers(io);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  socketUrl = `http://localhost:${httpServer.address().port}`;
});

afterEach(clearTestDB);

afterAll(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
  await closeTestDB();
});

function waitForEvent(socket, eventName, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for "${eventName}"`)), timeoutMs);
    socket.once(eventName, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

describe('Socket.IO', () => {
  it('rejects a connection with no token', async () => {
    const socket = ioClient(socketUrl, { transports: ['websocket'] });
    const error = await waitForEvent(socket, 'connect_error');
    expect(error.message).toMatch(/not authorized/i);
    socket.close();
  });

  it('rejects a connection with an invalid token', async () => {
    const socket = ioClient(socketUrl, {
      auth: { token: 'not-a-real-token' },
      transports: ['websocket'],
    });
    const error = await waitForEvent(socket, 'connect_error');
    expect(error.message).toMatch(/not authorized/i);
    socket.close();
  });

  it('authenticates a valid token and delivers a targeted notification only to that user', async () => {
    const { user: citizenA, token: tokenA } = await createUser({
      role: ROLES.CITIZEN,
      email: 'citizenA@example.com',
    });
    const { token: tokenB } = await createUser({ role: ROLES.CITIZEN, email: 'citizenB@example.com' });

    const socketA = ioClient(socketUrl, { auth: { token: tokenA }, transports: ['websocket'] });
    const socketB = ioClient(socketUrl, { auth: { token: tokenB }, transports: ['websocket'] });
    await Promise.all([waitForEvent(socketA, 'connect'), waitForEvent(socketB, 'connect')]);

    const { emitNotificationCreated } = await import('../src/sockets/index.js');
    const notifWaitA = waitForEvent(socketA, 'notification:new');
    let bReceived = false;
    socketB.once('notification:new', () => {
      bReceived = true;
    });

    emitNotificationCreated({
      user: citizenA._id,
      title: 'Test notification',
      message: 'Hello',
    });

    const payload = await notifWaitA;
    expect(payload.title).toBe('Test notification');
    expect(bReceived).toBe(false);

    socketA.close();
    socketB.close();
  });

  it("rejects a socket for a user whose account has since been deactivated", async () => {
    const { user } = await createUser({ role: ROLES.CITIZEN, isActive: false });
    const token = generateToken({ id: user._id, role: user.role });

    const socket = ioClient(socketUrl, { auth: { token }, transports: ['websocket'] });
    const error = await waitForEvent(socket, 'connect_error');
    expect(error.message).toMatch(/not authorized/i);
    socket.close();
  });
});

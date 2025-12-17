// src/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? window.location.origin.replace(/^http/, 'ws')
  : 'ws://localhost:3001';

let socket;

export function getSocket(token) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      withCredentials: true,
    });
  }
  return socket;
}

export default getSocket;

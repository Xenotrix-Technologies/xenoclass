import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';

let socket: Socket | null = null;

export const getStudentSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Student Socket] Connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('[Student Socket] Disconnected');
    });
  }
  return socket;
};

export const disconnectStudentSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

import io from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

let socket = null;

export const initSocket = () => {
    if (socket) return socket;

    socket = io(WS_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('WebSocket error:', error);
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        return initSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const emitAdminConnect = () => {
    const s = getSocket();
    s.emit('admin-connect');
};

export const onScoresUpdate = (callback) => {
    const s = getSocket();
    s.on('update_scores', callback);
};

export const offScoresUpdate = (callback) => {
    const s = getSocket();
    s.off('update_scores', callback);
};

export default {
    initSocket,
    getSocket,
    disconnectSocket,
    emitAdminConnect,
    onScoresUpdate,
    offScoresUpdate
};

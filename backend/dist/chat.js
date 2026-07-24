"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSockets = setupWebSockets;
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("./utils/prisma");
const url_1 = __importDefault(require("url"));
const SECRET_KEY = process.env.SECRET_KEY || 'my-super-secret-key-12345';
const connections = new Map();
function setupWebSockets(server) {
    const wss = new ws_1.WebSocketServer({ server, path: '/api/v1/chat/ws' }); // Note: We need dynamic paths or parse the url
    wss.on('connection', async (ws, req) => {
        const parameters = url_1.default.parse(req.url || '', true);
        const token = parameters.query.token;
        // Parse room ID from URL like /api/v1/chat/ws/:roomId
        const match = req.url?.match(/\/api\/v1\/chat\/ws\/(\d+)/);
        const roomId = match ? parseInt(match[1]) : null;
        if (!token || !roomId) {
            ws.close(1008, 'Unauthorized or Room ID missing');
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
            const user = await prisma_1.prisma.users.findUnique({ where: { email: decoded.sub } });
            if (!user)
                throw new Error('User not found');
            // Check if room exists
            const room = await prisma_1.prisma.chat_rooms.findUnique({ where: { id: roomId } });
            if (!room)
                throw new Error('Room not found');
            // Join room
            if (!connections.has(roomId)) {
                connections.set(roomId, new Set());
            }
            connections.get(roomId)?.add(ws);
            // Send history
            const history = await prisma_1.prisma.chat_messages.findMany({
                where: { room_id: roomId },
                orderBy: { created_at: 'asc' }
            });
            ws.send(JSON.stringify({
                type: 'history',
                messages: history
            }));
            ws.on('message', async (message) => {
                const data = JSON.parse(message.toString());
                if (data.type === 'message') {
                    const newMsg = await prisma_1.prisma.chat_messages.create({
                        data: {
                            room_id: roomId,
                            sender_id: user.id,
                            content: data.content,
                            is_system: false
                        }
                    });
                    // Broadcast
                    const outData = JSON.stringify({
                        type: 'message',
                        ...newMsg,
                        sender_name: user.full_name,
                        sender_role: user.role
                    });
                    connections.get(roomId)?.forEach(client => {
                        if (client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(outData);
                        }
                    });
                }
                if (data.type === 'typing') {
                    const outData = JSON.stringify({
                        type: 'typing',
                        user_id: user.id,
                        is_typing: data.is_typing
                    });
                    connections.get(roomId)?.forEach(client => {
                        if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(outData);
                        }
                    });
                }
            });
            ws.on('close', () => {
                connections.get(roomId)?.delete(ws);
            });
        }
        catch (e) {
            ws.close(1008, 'Unauthorized');
        }
    });
}

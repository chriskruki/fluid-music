"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Create HTTP server
const server = http_1.default.createServer(app);
// Create WebSocket server
const wss = new ws_1.WebSocketServer({ server, path: '/ws' });
// Store connected clients
const clients = {
    controllers: new Map(),
    simulators: new Map()
};
// Handle WebSocket connections
wss.on('connection', (ws) => {
    // Generate session ID for this connection
    const sessionId = (0, uuid_1.v4)();
    let clientRole = null;
    console.log(`New client connected: ${sessionId}`);
    // Handle messages from clients
    ws.on('message', (messageData) => {
        try {
            const message = JSON.parse(messageData.toString());
            // Process different message types
            switch (message.type) {
                case 'connect':
                    handleConnect(ws, message, sessionId);
                    clientRole = message.payload.role;
                    break;
                case 'input':
                    handleInput(ws, message, sessionId);
                    break;
                case 'command':
                    handleCommand(ws, message, sessionId);
                    break;
                default:
                    console.warn(`Unknown message type: ${message.type}`);
            }
        }
        catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    });
    // Handle client disconnection
    ws.on('close', () => {
        console.log(`Client disconnected: ${sessionId}`);
        // Remove from appropriate client list
        if (clientRole === 'controller') {
            clients.controllers.delete(sessionId);
        }
        else if (clientRole === 'simulator') {
            clients.simulators.delete(sessionId);
        }
        // Broadcast updated counts
        broadcastClientCounts();
    });
});
// Handle client connection
function handleConnect(ws, message, sessionId) {
    const { role } = message.payload;
    // Add to appropriate client list
    if (role === 'controller') {
        clients.controllers.set(sessionId, ws);
        console.log(`Controller connected: ${sessionId}`);
    }
    else if (role === 'simulator') {
        clients.simulators.set(sessionId, ws);
        console.log(`Simulator connected: ${sessionId}`);
    }
    // Send acknowledgment
    sendMessage(ws, {
        type: 'connect_ack',
        payload: {
            status: 'success',
            sessionId,
            connectedClients: {
                controllers: clients.controllers.size,
                simulators: clients.simulators.size
            }
        },
        timestamp: Date.now()
    });
    // Broadcast updated counts to all clients
    broadcastClientCounts();
}
// Handle input events from controllers
function handleInput(ws, message, sessionId) {
    // Add the controller ID and timestamp to the message
    const remoteMessage = {
        type: 'remote_input',
        payload: {
            ...message.payload,
            controllerId: sessionId
        },
        timestamp: Date.now()
    };
    // Broadcast to all simulators
    broadcastToSimulators(remoteMessage);
}
// Handle command events from controllers
function handleCommand(ws, message, sessionId) {
    // Add the controller ID and timestamp to the message
    const remoteMessage = {
        type: 'command',
        payload: {
            ...message.payload,
            controllerId: sessionId
        },
        timestamp: Date.now()
    };
    // Broadcast to all simulators
    broadcastToSimulators(remoteMessage);
}
// Broadcast message to all simulator clients
function broadcastToSimulators(message) {
    clients.simulators.forEach((client) => {
        if (isSocketOpen(client)) {
            sendMessage(client, message);
        }
    });
}
// Broadcast client counts to all clients
function broadcastClientCounts() {
    const countMessage = {
        type: 'client_counts',
        payload: {
            controllers: clients.controllers.size,
            simulators: clients.simulators.size
        },
        timestamp: Date.now()
    };
    [...clients.controllers.values(), ...clients.simulators.values()].forEach((client) => {
        if (isSocketOpen(client)) {
            sendMessage(client, countMessage);
        }
    });
}
// Helper function to check if WebSocket is open
function isSocketOpen(client) {
    return client.readyState === ws_1.WebSocket.OPEN;
}
// Helper function to send a message
function sendMessage(client, message) {
    if (isSocketOpen(client)) {
        client.send(JSON.stringify(message));
    }
}
// Log current directory and resolved paths
console.log('Current directory:', __dirname);
// Resolve the path to static files - if we're in dist folder, we need to serve from dist/public
const staticFilesPath = path_1.default.resolve(__dirname, './public');
console.log('Static files path:', staticFilesPath);
// Serve static files from the dist/public directory
app.use(express_1.default.static(staticFilesPath));
// Route to handle control page
app.get('/control', (req, res) => {
    res.sendFile(path_1.default.resolve(staticFilesPath, 'control.html'));
});
// Route to handle main page
app.get('/', (req, res) => {
    res.sendFile(path_1.default.resolve(staticFilesPath, 'index.html'));
});
// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

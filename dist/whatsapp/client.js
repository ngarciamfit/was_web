"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppClient = void 0;
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const qrcode = __importStar(require("qrcode-terminal"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class WhatsAppClient {
    constructor() {
        this.sock = null;
        this.webhook = null;
        this.webhook = process.env.WEBHOOK_URL || null;
        if (!this.webhook) {
            console.warn('No webhook URL configured in environment variables');
        }
    }
    async connect() {
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)('auth_info_baileys');
        const { version } = await (0, baileys_1.fetchLatestBaileysVersion)();
        this.sock = (0, baileys_1.default)({
            version,
            auth: {
                creds: state.creds,
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys),
            },
            printQRInTerminal: true,
        });
        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                qrcode.generate(qr, { small: true });
                console.log('QR Code generated. Please scan with WhatsApp.');
            }
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== baileys_1.DisconnectReason.loggedOut;
                console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
                if (shouldReconnect) {
                    this.connect();
                }
            }
            else if (connection === 'open') {
                console.log('Connected successfully!');
            }
        });
        this.sock.ev.on('creds.update', saveCreds);
        this.sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe && this.webhook) {
                        try {
                            const response = await fetch(this.webhook, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(msg),
                            });
                            const responseData = await response.text();
                            console.log('Webhook response:', responseData);
                            // Send the webhook response back to the sender
                            if (msg.key.remoteJid) {
                                await this.sock?.sendMessage(msg.key.remoteJid, { text: responseData });
                            }
                        }
                        catch (error) {
                            console.error('Error sending webhook:', error);
                            // Send error message back to the sender
                            if (msg.key.remoteJid) {
                                await this.sock?.sendMessage(msg.key.remoteJid, {
                                    text: 'Error processing your message. Please try again later.'
                                });
                            }
                        }
                    }
                }
            }
        });
    }
    async sendMessage(to, message) {
        if (!this.sock) {
            throw new Error('WhatsApp client not connected');
        }
        await this.sock.sendMessage(to, { text: message });
    }
}
exports.WhatsAppClient = WhatsAppClient;

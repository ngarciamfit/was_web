"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("./whatsapp/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
const whatsappClient = new client_1.WhatsAppClient();
// Initialize WhatsApp client
whatsappClient.connect()
    .then(() => console.log('WhatsApp client initialized'))
    .catch((err) => console.error('WhatsApp client initialization error:', err));
// Send message endpoint
app.post('/send', async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) {
        return res.status(400).json({ error: 'To and message are required' });
    }
    try {
        await whatsappClient.sendMessage(to, message);
        res.json({ message: 'Message sent successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

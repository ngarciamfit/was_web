import express from 'express';
import { WhatsAppClient } from './whatsapp/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const whatsappClient = new WhatsAppClient();

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
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
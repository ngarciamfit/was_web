# WhatsApp Webhook Bot

A WhatsApp bot built with Baileys that automatically forwards messages to a webhook and sends the webhook response back to the sender.

## Features

- Connect to WhatsApp using QR code
- Automatic message forwarding to configured webhook
- Automatic response sending back to WhatsApp
- Send messages programmatically
- Filter messages by phone number
- Ignore group messages

## Prerequisites

- Node.js 17 or higher
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
WEBHOOK_URL=https://your-webhook-url.com
ALLOWED_NUMBER=1234567890  # Optional: Only allow messages from this number
```

## Usage

1. Start the server:
```bash
npm run dev
```

2. Scan the QR code that appears in the terminal with your WhatsApp mobile app

3. Send a message:
```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"to": "1234567890@s.whatsapp.net", "message": "Hello!"}'
```

## How it works

1. When a message is received on WhatsApp:
   - It checks if the message is from an allowed number (if configured)
   - It ignores group messages
   - It ignores messages sent by the bot itself
   - If all checks pass, it forwards the message to the configured webhook URL
2. The webhook response is automatically sent back to the original sender in WhatsApp
3. If there's an error processing the webhook, an error message is sent back to the sender

## API Endpoints

- `POST /send` - Send a message manually

## License

MIT 
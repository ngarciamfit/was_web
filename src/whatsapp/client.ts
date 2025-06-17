import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  WASocket,
  isJidGroup,
  jidDecode,
  isJidUser
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';

dotenv.config();

export class WhatsAppClient {
  private sock: WASocket | null = null;
  private webhook: string | null = null;
  private allowedNumber: string | null = null;

  constructor() {
    this.webhook = process.env.WEBHOOK_URL || null;
    this.allowedNumber = process.env.ALLOWED_NUMBER || null;

    if (!this.webhook) {
      console.warn('No webhook URL configured in environment variables');
    }
    if (!this.allowedNumber) {
      console.warn('No allowed number configured in environment variables');
    }
  }

  private isAllowedNumber(jid: string): boolean {
    if (!this.allowedNumber) return true; // Si no hay número configurado, permitir todos

    const decodedJid = jidDecode(jid);
    if (!decodedJid) return false;

    // Remover el prefijo del país y cualquier otro carácter no numérico
    const cleanNumber = decodedJid.user.replace(/\D/g, '');
    const cleanAllowedNumber = this.allowedNumber.replace(/\D/g, '');

    return cleanNumber === cleanAllowedNumber;
  }

  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys),
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
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
        if (shouldReconnect) {
          this.connect();
        }
      } else if (connection === 'open') {
        console.log('Connected successfully!');
      }
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          console.log('msg', msg);

          /* msg {
            key: {
              remoteJid: '5492920601810@s.whatsapp.net',
              fromMe: false,
              id: 'CA2B14CAEADFC07A08EFFD9D9EB41A8F',
              participant: undefined
            },
            messageTimestamp: 1748890642,
            pushName: 'Sasha Figliozzi Mange',
            broadcast: false,
            message: Message {
              conversation: 'Hola',
              messageContextInfo: MessageContextInfo {
                deviceListMetadata: [DeviceListMetadata],
                deviceListMetadataVersion: 2,
                messageSecret: [Uint8Array]
              }
            }
          } */
          // Solo procesar mensajes que no sean de grupos, no sean enviados por el bot y sean del número permitido
          if (!msg.key.fromMe &&
            this.webhook &&
            msg.key.remoteJid &&
            isJidUser(msg.key.remoteJid) &&
            this.isAllowedNumber(msg.key.remoteJid)) {
            try {
              console.log('msg.key.remoteJid', msg.key.remoteJid);
              /* const response = await fetch(this.webhook, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(msg),
              });

              const responseData = await response.text(); */
              const responseData = "Holaaa";              
              console.log('Webhook response:', responseData);

              // Send the webhook response back to the sender
              if (msg.key.remoteJid) {
                await this.sock?.sendMessage(msg.key.remoteJid, { text: responseData });
              }
            } catch (error) {
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

  async sendMessage(to: string, message: string) {
    if (!this.sock) {
      throw new Error('WhatsApp client not connected');
    }
    await this.sock.sendMessage(to, { text: message });
  }
} 
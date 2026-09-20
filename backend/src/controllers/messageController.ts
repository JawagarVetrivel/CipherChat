import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { messageService } from '../services/messageService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const sendMessageSchema = z.object({
  id: z.string().optional(),
  conversationId: z.string().min(1),
  ciphertext: z.string().min(1),
  header: z.record(z.unknown()).default({}),
  timestamp: z.string().optional(),
});

export class MessageController {
  public async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const messages = await messageService.getMessagesForConversation(id);
      res.status(200).json(messages);
    } catch (err) {
      next(err);
    }
  }

  public async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const senderId = req.user!.id;
      const validated = sendMessageSchema.parse(req.body);

      const storedMessage = await messageService.storeEncryptedMessage({
        id: validated.id,
        conversationId: validated.conversationId,
        senderId,
        ciphertext: validated.ciphertext,
        header: validated.header,
        timestamp: validated.timestamp,
      });

      res.status(201).json(storedMessage);
    } catch (err) {
      next(err);
    }
  }
}

export const messageController = new MessageController();

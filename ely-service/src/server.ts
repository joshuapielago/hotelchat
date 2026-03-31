import express from 'express';
import { webhookHandler } from './webhooks/handler';
import { getConversationState, setConversationState } from './utils/redis';
import { logger } from './utils/logger';
import type { ChatwootWebhookEvent } from './types';

export function createServer() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ely-ai-service', timestamp: new Date().toISOString() });
  });

  // Chatwoot webhook endpoint — receives all bot events
  app.post('/webhooks/chatwoot', async (req, res) => {
    const event = req.body as ChatwootWebhookEvent;

    logger.debug({ event: event.event, conversationId: event.conversation?.id }, 'Webhook received');

    // Respond immediately to avoid Chatwoot timeout
    res.status(200).json({ status: 'received' });

    // Process asynchronously
    try {
      await webhookHandler.handle(event);
    } catch (err) {
      logger.error({ err, event: event.event }, 'Webhook handler error');
    }
  });

  // Endpoint to mark a conversation as human-handled
  // Called when a human agent sends a message (detected via a separate Chatwoot webhook)
  app.post('/webhooks/agent-reply', async (req, res) => {
    const { conversation_id } = req.body;
    if (conversation_id) {
      await setConversationState(conversation_id, { humanResponded: true });
      logger.info({ conversationId: conversation_id }, 'Conversation marked as human-handled');
    }
    res.json({ status: 'ok' });
  });

  // Get conversation state (for debugging)
  app.get('/conversations/:id/state', async (req, res) => {
    const state = await getConversationState(parseInt(req.params.id, 10));
    res.json(state || { humanResponded: false });
  });

  return app;
}

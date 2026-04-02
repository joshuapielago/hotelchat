import { getConfig } from '../config';
import type { ChatwootMessage } from '../types';
import { logger } from '../utils/logger';

export class ChatwootClient {
  private baseUrl: string;
  private botToken: string;
  private accountId: number;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.CHATWOOT_BASE_URL.replace(/\/$/, '');
    this.botToken = config.CHATWOOT_BOT_TOKEN;
    this.accountId = config.CHATWOOT_ACCOUNT_ID;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      api_access_token: this.botToken,
    };
  }

  private url(path: string): string {
    return `${this.baseUrl}/api/v1/accounts/${this.accountId}${path}`;
  }

  async sendMessage(conversationId: number, content: string, isPrivate = false): Promise<ChatwootMessage | null> {
    try {
      const res = await fetch(this.url(`/conversations/${conversationId}/messages`), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          content,
          message_type: 'outgoing',
          private: isPrivate,
        }),
      });

      if (!res.ok) {
        logger.error({ status: res.status, conversationId }, 'Failed to send message to Chatwoot');
        return null;
      }

      return (await res.json()) as ChatwootMessage;
    } catch (err) {
      logger.error({ err, conversationId }, 'Error sending message to Chatwoot');
      return null;
    }
  }

  async handoffConversation(conversationId: number, handoffMessage: string): Promise<boolean> {
    // Send the handoff message to the guest
    await this.sendMessage(conversationId, handoffMessage);

    // Toggle conversation status to open (triggers bot_handoff in Chatwoot)
    try {
      const res = await fetch(this.url(`/conversations/${conversationId}/toggle_status`), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ status: 'open' }),
      });

      if (!res.ok) {
        logger.error({ status: res.status, conversationId }, 'Failed to hand off conversation');
        return false;
      }

      return true;
    } catch (err) {
      logger.error({ err, conversationId }, 'Error handing off conversation');
      return false;
    }
  }

  async getConversationMessages(conversationId: number): Promise<ChatwootMessage[]> {
    try {
      const res = await fetch(this.url(`/conversations/${conversationId}/messages`), {
        method: 'GET',
        headers: this.headers,
      });

      if (!res.ok) {
        logger.error({ status: res.status, conversationId }, 'Failed to fetch messages');
        return [];
      }

      const data = (await res.json()) as { payload: ChatwootMessage[] };
      return data.payload || [];
    } catch (err) {
      logger.error({ err, conversationId }, 'Error fetching messages');
      return [];
    }
  }

  async getConversation(conversationId: number) {
    try {
      const res = await fetch(this.url(`/conversations/${conversationId}`), {
        method: 'GET',
        headers: this.headers,
      });

      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      logger.error({ err, conversationId }, 'Error fetching conversation');
      return null;
    }
  }

  async addLabel(conversationId: number, label: string): Promise<void> {
    try {
      // Get existing labels first
      const conversation = await this.getConversation(conversationId);
      const existingLabels: string[] = conversation?.labels || [];

      await fetch(this.url(`/conversations/${conversationId}/labels`), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ labels: [...existingLabels, label] }),
      });
    } catch (err) {
      logger.error({ err, conversationId, label }, 'Error adding label');
    }
  }

  async assignAgent(conversationId: number, agentId: number): Promise<void> {
    try {
      await fetch(this.url(`/conversations/${conversationId}/assignments`), {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ assignee_id: agentId }),
      });
    } catch (err) {
      logger.error({ err, conversationId }, 'Error assigning agent');
    }
  }

  async updateContact(contactId: number, attributes: Record<string, unknown>): Promise<void> {
    try {
      await fetch(this.url(`/contacts/${contactId}`), {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(attributes),
      });
    } catch (err) {
      logger.error({ err, contactId }, 'Error updating contact');
    }
  }
}

export const chatwootClient = new ChatwootClient();

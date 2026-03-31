// Chatwoot webhook event types
export interface ChatwootWebhookEvent {
  event: ChatwootEventType;
  id?: number;
  account?: ChatwootAccount;
  conversation?: ChatwootConversation;
  content?: string;
  content_type?: string;
  content_attributes?: Record<string, unknown>;
  message_type?: 'incoming' | 'outgoing' | 'activity' | 'template';
  sender?: ChatwootSender;
  inbox?: ChatwootInbox;
  created_at?: string;
}

export type ChatwootEventType =
  | 'message_created'
  | 'message_updated'
  | 'conversation_created'
  | 'conversation_resolved'
  | 'conversation_opened'
  | 'webwidget_triggered';

export interface ChatwootAccount {
  id: number;
  name: string;
}

export interface ChatwootConversation {
  id: number;
  display_id: number;
  account_id: number;
  inbox_id: number;
  status: 'open' | 'resolved' | 'pending' | 'snoozed';
  assignee?: ChatwootAgent;
  contact?: ChatwootContact;
  messages?: ChatwootMessage[];
  channel?: string;
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
  meta?: {
    sender?: ChatwootSender;
    channel?: string;
  };
}

export interface ChatwootMessage {
  id: number;
  content: string;
  content_type: string;
  message_type: number; // 0=incoming, 1=outgoing, 2=activity
  conversation_id: number;
  account_id: number;
  sender?: ChatwootSender;
  created_at: number;
  content_attributes?: Record<string, unknown>;
}

export interface ChatwootSender {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  type: 'contact' | 'user' | 'agent_bot';
  avatar_url?: string;
}

export interface ChatwootContact {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  identifier?: string;
  custom_attributes?: Record<string, unknown>;
}

export interface ChatwootAgent {
  id: number;
  name: string;
  email: string;
  type?: string;
}

export interface ChatwootInbox {
  id: number;
  name: string;
  channel_type?: string;
}

// AI Service internal types
export interface AIResponse {
  content: string;
  resolved: boolean;
  handoffReason?: string;
  confidence: number;
  detectedLanguage: string;
  detectedIntent?: string;
  leadData?: LeadData;
  guardrailTriggered: boolean;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface LeadData {
  email?: string;
  phone?: string;
  name?: string;
  intent?: string;
}

export interface KnowledgeContext {
  hotelName: string;
  entries: Array<{
    category: string;
    question: string;
    answer: string;
  }>;
  config: {
    personality: string;
    welcomeMessage?: string;
    handoffMessage: string;
    competitorBlocklist: string[];
    activePromotions: unknown;
  };
}

export interface ConversationState {
  hotelId: string;
  conversationId: number;
  isHandedOff: boolean;
  humanResponded: boolean;
  messageCount: number;
  lastBotMessageAt?: number;
}

export interface GuardrailResult {
  passed: boolean;
  type?: string;
  severity?: string;
  details?: string;
}

import { PubSub } from "graphql-subscriptions";
import { Context } from "graphql-ws/lib/server";
import { IConversation } from "../models/ConversationModel";

/**
 * Server Configuration
 */
export interface Session {
  user?: User;
}

export interface SubscriptionContext extends Context {
  connectionParams: {
    userId?: string;
  };
}

export interface GraphQLContext {
  userId: string | null;
  pubsub: PubSub;
}

/**
 * Users
 */
export interface User {
  id: string;
  username: string;
}

export interface CreateUsernameResponse {
  success?: boolean;
  error?: string;
}

export interface SearchUsersResponse {
  users: Array<User>;
}

/**
 * Messages
 */
export interface SendMessageArguments {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
}

/**
 * Conversations
 */
export interface ConversationCreatedSubscriptionPayload {
  conversationCreated: IConversation;
}

export interface ConversationUpdatedSubscriptionData {
  conversationUpdated: {
    conversation: IConversation;
    addedUserIds: Array<string>;
    removedUserIds: Array<string>;
  };
}

export interface ConversationDeletedSubscriptionPayload {
  conversationDeleted: IConversation;
}

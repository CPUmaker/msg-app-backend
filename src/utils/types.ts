import { PubSub } from "graphql-subscriptions";
import { Context } from "graphql-ws/lib/server";

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

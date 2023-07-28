import mongoose from "mongoose";
import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";

import {
  GraphQLContext,
  SendMessageArguments,
  SendMessageSubscriptionPayload,
  SubscriptEvent,
} from "../../utils/types";
import Message, { IMessage } from "../../models/MessageModel";
import Conversation, { IConversation } from "../../models/ConversationModel";
import Participant, {
  IParticipant,
} from "../../models/CoversationParticipantModel";
import UserService from "../../services/UserService";
import User from "../../models/UserModel";

type ObjectId = mongoose.Types.ObjectId;

const resolvers = {
  Query: {
    messages: async function (
      _: any,
      args: { conversationId: string },
      context: GraphQLContext
    ): Promise<Array<IMessage>> {
      const { userId } = context;
      const { conversationId } = args;
      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      const conversation = await Conversation.findById(conversationId)
        .populate({
          path: "participants",
          populate: "user",
        })
        .exec();
      if (!conversation) {
        throw new GraphQLError("Conversation Not Found");
      }

      const allowedToView = UserService.userIsConversationParticipant(
        conversation.participants as IParticipant[],
        userId
      );

      if (!allowedToView) {
        throw new GraphQLError("Not Authorized");
      }

      try {
        const messages: IMessage[] = await Message.find({
          conversation: conversationId,
        })
          .populate("sender")
          .exec();
        return messages;
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
  },
  Mutation: {
    sendMessage: async function (
      _: any,
      args: SendMessageArguments,
      context: GraphQLContext
    ): Promise<boolean> {
      const { userId, pubsub } = context;
      const { id: messageId, senderId, conversationId, body } = args;
      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      try {
        const newMessage = new Message({
          sender: await User.findById(senderId),
          conversation: conversationId,
          body,
        });
        await newMessage.save();

        const participant = await Participant.findOne({
          user: userId,
          conversation: conversationId,
        }).exec();
        if (!participant) {
          throw new GraphQLError("Participant does not exist");
        }
        const participantId = participant._id;

        const conversation = await Conversation.findById(conversationId)
          .populate({ path: "participants", populate: "user" })
          .exec();
        if (!conversation) {
          throw new GraphQLError("Conversation Not Found");
        }

        (conversation.participants as IParticipant[]).forEach(async (p) => {
          p.hasSeenLatestMessage = p._id === participantId;
          await p.save();
        });

        conversation.latestMessage = newMessage;
        conversation.messages.push(newMessage);
        await conversation.save();

        pubsub.publish(SubscriptEvent.MESSAGE_SENT, {
          messageSent: newMessage,
        });
        pubsub.publish(SubscriptEvent.CONVERSATION_UPDATED, {
          conversationUpdated: {
            conversation,
          },
        });

        return true;
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
  },
  Subscription: {
    messageSent: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;

          return pubsub.asyncIterator([SubscriptEvent.MESSAGE_SENT]);
        },
        (
          payload: SendMessageSubscriptionPayload,
          args: { conversationId: string },
          context: GraphQLContext
        ) => {
          const {
            messageSent: { conversation: conversationId },
          } = payload;
          return (
            (conversationId as ObjectId).toString() === args.conversationId
          );
        }
      ),
    },
  },
};

export default resolvers;

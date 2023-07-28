import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import mongoose, { Mongoose } from "mongoose";

import {
  GraphQLContext,
  SubscriptEvent,
  ConversationCreatedSubscriptionPayload,
  ConversationUpdatedSubscriptionData,
  ConversationDeletedSubscriptionPayload,
} from "../../utils/types";
import Participant, {
  IParticipant,
} from "../../models/CoversationParticipantModel";
import Conversation, { IConversation } from "../../models/ConversationModel";
import Message, { IMessage } from "../../models/MessageModel";
import User, { IUser } from "../../models/UserModel";
import UserService from "../../services/UserService";

const resolvers = {
  Query: {
    conversations: async function getConversations(
      _: any,
      args: Record<string, never>,
      context: GraphQLContext
    ): Promise<Array<IParticipant["conversation"]>> {
      const { userId } = context;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      try {
        const participants = await Participant.find({
          user: userId,
        })
          .populate({
            path: "conversation",
            populate: [
              { path: "participants", populate: "user" },
              { path: "latestMessage", populate: "sender" },
            ],
          })
          .exec();
        const conversations = participants.map(
          (participant) => participant.conversation
        );

        return conversations;
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
  },

  Mutation: {
    createConversation: async function (
      _: any,
      args: { participantIds: Array<string> },
      context: GraphQLContext
    ): Promise<{ conversationId: string }> {
      const { userId, pubsub } = context;
      const { participantIds } = args;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      try {
        const conversation: IConversation = new Conversation();
        conversation.participants = await Promise.all(
          participantIds.map(async (participantUserId) => {
            const participant: IParticipant = new Participant({
              user: await User.findById(participantUserId),
              conversation: conversation._id,
              hasSeenLatestMessage: participantUserId === userId,
            });
            return await participant.save();
          })
        );
        await conversation.save();

        pubsub.publish(SubscriptEvent.CONVERSATION_CREATED, {
          conversationCreated: await conversation.populate({
            path: "participants",
            populate: "user",
          }),
        });

        return { conversationId: conversation._id.toString() };
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
    markConversationAsRead: async function (
      _: any,
      args: { userId: string; conversationId: string },
      context: GraphQLContext
    ): Promise<boolean> {
      const { userId } = context;
      const { userId: participantUserId, conversationId } = args;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      try {
        await Participant.findOneAndUpdate(
          {
            user: participantUserId,
            conversation: conversationId,
          },
          { hasSeenLatestMessage: true }
        );

        return true;
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
    deleteConversation: async function (
      _: any,
      args: { conversationId: string },
      context: GraphQLContext
    ): Promise<boolean> {
      const { userId, pubsub } = context;
      const { conversationId } = args;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      try {
        const deletedConversation = await Conversation.findById(conversationId)
          .populate({ path: "participants", populate: "user" })
          .populate({ path: "latestMessage", populate: "sender" })
          .exec();
        if (!deletedConversation) {
          throw new GraphQLError("Conversation does not exist");
        }
        await Conversation.findByIdAndDelete(conversationId);

        pubsub.publish(SubscriptEvent.CONVERSATION_DELETED, {
          conversationDeleted: deletedConversation,
        });

        return true;
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
    updateParticipants: async function (
      _: any,
      args: { conversationId: string; participantIds: Array<string> },
      context: GraphQLContext
    ): Promise<boolean> {
      const { userId, pubsub } = context;
      const { conversationId, participantIds } = args;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      try {
        const conversation = await Conversation.findById(conversationId)
          .populate({ path: "participants", populate: "user" })
          .exec();
        if (!conversation) {
          throw new Error("The conversationId does not exist");
        }

        const participants = conversation.participants as IParticipant[];

        const existingParticipants = participants.map((participant) =>
          (participant.user as IUser)._id.toString()
        );

        const participantsToDelete = existingParticipants.filter(
          (pUID) => !participantIds.includes(pUID)
        );

        const participantsToCreate = participantIds.filter(
          (pUID) => !existingParticipants.includes(pUID)
        );

        // Delete participants
        conversation.participants = participants.filter(
          (participant) =>
            !participantsToDelete.includes(participant.user._id.toString())
        );
        const removedParticipants = await Promise.all(
          participantsToDelete.map(
            async (pUID) => await Participant.findOneAndDelete({ user: pUID })
          )
        );

        // Add participants
        const addedParticipants = await Promise.all(
          participantsToCreate.map(async (pUID) => {
            const participant: IParticipant = new Participant({
              user: pUID,
              conversation: conversationId,
              hasSeenLatestMessage: true,
            });
            return await participant.save();
          })
        );
        conversation.participants.push(...addedParticipants);

        await conversation.save();

        pubsub.publish(SubscriptEvent.CONVERSATION_UPDATED, {
          conversationUpdated: {
            conversation: await Conversation.findById(conversationId)
              .populate({
                path: "participants",
                populate: "user",
              })
              .populate({
                path: "latestMessage",
                populate: "sender",
              })
              .exec(),
            addedUserIds: participantsToCreate,
            removedUserIds: participantsToDelete,
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
    conversationCreated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator([SubscriptEvent.CONVERSATION_CREATED]);
        },
        (
          payload: ConversationCreatedSubscriptionPayload,
          _,
          context: GraphQLContext
        ) => {
          const { userId } = context;

          if (!userId) {
            throw new GraphQLError("The credential is invalid");
          }

          const {
            conversationCreated: { participants },
          } = payload;

          return !!(participants as IParticipant[]).find(
            (p) => (p.user as IUser).id.toString() === userId
          );
        }
      ),
    },
    conversationUpdated: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator([SubscriptEvent.CONVERSATION_UPDATED]);
        },
        (
          payload: ConversationUpdatedSubscriptionData,
          _,
          context: GraphQLContext
        ) => {
          const { userId } = context;

          if (!userId) {
            throw new GraphQLError("The credential is invalid");
          }

          const {
            conversationUpdated: {
              conversation: { participants },
              addedUserIds,
              removedUserIds,
            },
          } = payload;

          const userIsParticipant = UserService.userIsConversationParticipant(
            participants as IParticipant[],
            userId
          );

          const lastestMessage = payload.conversationUpdated.conversation
            .latestMessage as IMessage;
          const userSentLatestMessage =
            (lastestMessage.sender as mongoose.Types.ObjectId).toString() ===
            userId;

          const userIsBeingRemoved =
            removedUserIds &&
            Boolean(removedUserIds.find((id) => id === userId));

          return (
            (userIsParticipant && !userSentLatestMessage) ||
            userSentLatestMessage ||
            userIsBeingRemoved
          );
        }
      ),
    },
    conversationDeleted: {
      subscribe: withFilter(
        (_: any, __: any, context: GraphQLContext) => {
          const { pubsub } = context;
          return pubsub.asyncIterator([SubscriptEvent.CONVERSATION_DELETED]);
        },
        (
          payload: ConversationDeletedSubscriptionPayload,
          _,
          context: GraphQLContext
        ) => {
          const { userId } = context;

          if (!userId) {
            throw new GraphQLError("The credential is invalid");
          }

          const {
            conversationDeleted: { participants },
          } = payload;

          return !!(participants as IParticipant[]).find(
            (p) => (p.user as mongoose.Types.ObjectId).toString() === userId
          );
        }
      ),
    },
  },
};

export default resolvers;

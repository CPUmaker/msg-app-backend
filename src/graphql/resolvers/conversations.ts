import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import mongoose from "mongoose";

import { GraphQLContext } from "../../utils/types";
import Participant, { IParticipant } from "../../models/CoversationParticipantModel";

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
        const participants = await Participant.find({user: new mongoose.Types.ObjectId(userId)}).populate("conversation");
        const conversations = participants.map((participant) => participant.conversation);

        return conversations;
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
  },
};

export default resolvers;

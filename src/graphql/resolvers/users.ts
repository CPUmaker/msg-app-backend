import { GraphQLError } from "graphql";
import { CreateUsernameResponse, GraphQLContext } from "../../utils/types";

import User, { IUser } from "../../models/UserModel";
import Participant, {
  IParticipant,
} from "../../models/CoversationParticipantModel";
import UserService from "../../services/UserService";

const resolvers = {
  Query: {
    user: async function user(
      _: any,
      args: Record<string, never>,
      context: GraphQLContext
    ): Promise<IUser> {
      const { userId } = context;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      const user = (await UserService.findById(
        userId
      )) as IUser;

      return user;
    },
    searchUsers: async function searchUsers(
      _: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<Array<IUser>> {
      const { username: searchedUsername } = args;
      const { userId } = context;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      const { username: myUsername } = (await UserService.findById(
        userId
      )) as IUser;

      try {
        const users = User.find({
          username: { $regex: searchedUsername, $options: "i" },
        })
          .ne("username", myUsername)
          .exec();

        return users;
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
    usersInConversation: async function usersInConversation(
      _: any,
      args: { conversationId: string },
      context: GraphQLContext
    ): Promise<Array<IUser>> {
      const { conversationId } = args;
      const { userId } = context;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      try {
        const participants = (await Participant.find({
          conversation: conversationId,
        })
          .populate("user")
          .exec()) as IParticipant[];
        const users = participants.map((value) => value.user as IUser);

        return users;
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
  },
  Mutation: {
    createUsername: async function createUsername(
      _: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<CreateUsernameResponse> {
      const { username } = args;
      const { userId } = context;

      if (!userId) {
        throw new GraphQLError("The credential is invalid");
      }

      if (username.length < 6) {
        return { error: "The username must have at least 6 characters" };
      }

      try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return {
            error: "Username already taken. Try another",
          };
        }

        const user = await UserService.findById(userId);
        if (!user) {
          return { error: "The user does not exist" };
        }

        user.username = username;
        await user.save();

        return { success: true };
      } catch (error: any) {
        console.log("[error]", error);
        throw new GraphQLError(error?.message);
      }
    },
  },
};

export default resolvers;

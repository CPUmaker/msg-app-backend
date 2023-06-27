import { GraphQLError } from "graphql";
import { CreateUsernameResponse, GraphQLContext } from "../../utils/types";

import User, { IUser } from "../../models/UserModel";
import UserService from "../../services/UserService";

const resolvers = {
  Query: {
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
  },
};

export default resolvers;

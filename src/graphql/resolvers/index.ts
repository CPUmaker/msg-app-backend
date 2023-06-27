import merge from "lodash.merge";

import conversationResolvers from "./conversations";
import messageResolvers from "./messages";
import userResolvers from "./users";
import scalarResolvers from "./scalars";

const resolvers = merge(
  {},
  scalarResolvers,
  userResolvers,
  conversationResolvers,
  messageResolvers
);

export default resolvers;

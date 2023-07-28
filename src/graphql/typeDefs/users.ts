import gql from "graphql-tag";

const typeDefs = gql`
  scalar Date

  type User {
    id: String
    username: String
    email: String
    avatar: String
  }

  type CreateUsernameResponse {
    success: Boolean
    error: String
  }

  type Query {
    user: User
  }

  type Query {
    searchUsers(username: String!): [User]
  }

  type Query {
    usersInConversation(conversationId: String!): [User]
  }

  type Mutation {
    createUsername(username: String!): CreateUsernameResponse
  }
`;

export default typeDefs;

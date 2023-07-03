import gql from "graphql-tag";

const typeDefs = gql`
  scalar Date

  type User {
    id: String
    username: String
  }

  type CreateUsernameResponse {
    success: Boolean
    error: String
  }

  type Query {
    searchUsers(username: String!): [User]
  }

  type Mutation {
    createUsername(username: String!): CreateUsernameResponse
  }
`;

export default typeDefs;

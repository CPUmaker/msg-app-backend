import gql from "graphql-tag";

const typeDefs = gql`
  scalar Date

  type User {
    id: String
    username: String
  }

  type Query {
    searchUsers(username: String!): [User]
  }
`;

export default typeDefs;

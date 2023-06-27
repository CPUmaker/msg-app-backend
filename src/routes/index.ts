import { Router } from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import authRouter from "./auth";
import typeDefs from "../schemas/schema";
import resolvers from "./graphql";

const server = new ApolloServer({ typeDefs, resolvers });

const router = Router();

router.use("/auth", authRouter);
server.start().then(() => {
  router.use("/graphql", expressMiddleware(server));
});

export default router;

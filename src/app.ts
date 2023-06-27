import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import { useServer } from "graphql-ws/lib/use/ws";
import { Context } from "graphql-ws/lib/server";
import { PubSub } from "graphql-subscriptions";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import { json } from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import ws from "ws";

import indexRouter from "./routes";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import * as Auth from "./middlewares/authentication";
import { GraphQLContext, SubscriptionContext } from "./utils/types";

const main = async () => {
  dotenv.config({ path: path.join(__dirname, "../.env") });

  mongoose
    .connect(process.env.DATABASE_URL)
    .then(() => console.log("Successfully connected to MongoDB"));

  const app: Express = express();
  const httpServer = createServer(app);

  app.use(express.static(path.join(__dirname, "../public")));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use("/", indexRouter);

  const wss = new ws.WebSocketServer({
    server: httpServer,
    path: "/graphql/subscriptions",
  });

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Context params
  const pubsub = new PubSub();

  const getSubscriptionContext = async (
    ctx: SubscriptionContext
  ): Promise<GraphQLContext> => {
    ctx;
    // ctx is the graphql-ws Context where connectionParams live
    if (ctx.connectionParams && ctx.connectionParams.userId) {
      const { userId } = ctx.connectionParams;
      return { userId, pubsub };
    }
    // Otherwise let our resolvers know we don't have a current user
    return { userId: null, pubsub };
  };

  const wssGraphQL = useServer(
    {
      schema,
      context: (ctx: SubscriptionContext) => {
        return getSubscriptionContext(ctx);
      },
    },
    wss
  );

  // Set up ApolloServer.
  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wssGraphQL.dispose();
            },
          };
        },
      },
    ],
  });
  await server.start();

  const corsOptions = {
    origin: process.env.BASE_URL,
    credentials: true,
  };

  app.use(
    "/graphql",
    Auth.TokenDecoder,
    cors<cors.CorsRequest>(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<GraphQLContext> => {
        return { userId: req.userId, pubsub: pubsub };
      },
    })
  );

  const PORT = process.env.PORT;
  await new Promise<void>((resolve) => {
    httpServer.listen({ port: PORT }, resolve);
  });
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
};

main().catch((error) => console.log(error));

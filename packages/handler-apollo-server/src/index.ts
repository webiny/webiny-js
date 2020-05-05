import { HandlerApolloServerOptions } from "./types";
import { createSchema, createHandlerApolloServer, apolloHandler } from "./plugins";

export default (options: HandlerApolloServerOptions = {}) => [
    createHandlerApolloServer(options),
    apolloHandler,
    createSchema
];

import { HttpHandlerApolloServerOptions } from "./types";
import { createSchema, createHandlerApolloServer, apolloHandler } from "./plugins";

export default (options: HttpHandlerApolloServerOptions = {}) => [
    createHandlerApolloServer(options),
    apolloHandler,
    createSchema
];

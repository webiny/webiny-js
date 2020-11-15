import { HandlerApolloServerOptions } from "./types";
import { createHandlerApolloServer } from "./plugins";

export default (options: HandlerApolloServerOptions = {}) => [createHandlerApolloServer(options)];

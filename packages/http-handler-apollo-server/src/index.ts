import { HttpHandlerApolloServerOptions } from "./types";
import apolloHandlerPlugin from "./apolloHandlerPlugin";
import createHandlerApolloServerPlugin from "./createHandlerApolloServerPlugin";

export default (options: HttpHandlerApolloServerOptions = {}) => [
    createHandlerApolloServerPlugin(options),
    apolloHandlerPlugin
];

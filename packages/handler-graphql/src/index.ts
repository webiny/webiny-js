import { HandlerGraphQLOptions } from "./types";
import createGraphQLHandler from "./createGraphQLHandler";

export * from "./errors";
export * from "./responses";
export * from "./plugins";
export * from "./processRequestBody";
export * from "./createResolverDecorator";
export * from "./ResolverDecoration";

export default (options: HandlerGraphQLOptions = {}) => [createGraphQLHandler(options)];

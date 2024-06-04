import { HandlerGraphQLOptions } from "./types";
import createGraphQLHandler from "./createGraphQLHandler";

export * from "./errors";
export * from "./responses";
export * from "./utils";
export * from "./plugins";
export * from "./processRequestBody";

export default (options: HandlerGraphQLOptions = {}) => [createGraphQLHandler(options)];

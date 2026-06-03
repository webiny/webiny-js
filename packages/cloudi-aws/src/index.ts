export { createLambdaHandler } from "./createLambdaHandler.js";
export type { CreateLambdaHandlerOptions } from "./createLambdaHandler.js";

export * from "./abstractions/index.js";
export * from "./adapters/ApiGatewayAdapter.js";

// Re-export core for convenience
export {
    CloudHandler,
    ErrorHandler,
    NotFoundHandler,
    isHttpRequest,
    Container,
    Abstraction
} from "@cloudi/core";
export type { IHttpRequest, IHttpResponse, NextFunction, HandlerSetup } from "@cloudi/core";

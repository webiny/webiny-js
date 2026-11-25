export { createLambdaHandler } from "./createLambdaHandler.js";
export type { CreateLambdaHandlerOptions } from "./createLambdaHandler.js";
export { AwsLambdaKernelPlatform } from "./AwsLambdaKernelPlatform.js";
export type { AwsLambdaInvocation } from "./AwsLambdaKernelPlatform.js";
export { createStreamLambdaHandler } from "./createStreamLambdaHandler.js";
export type {
    CreateStreamLambdaHandlerOptions,
    StreamLambdaHandler
} from "./createStreamLambdaHandler.js";
export { AwsLambdaStreamKernelPlatform } from "./AwsLambdaStreamKernelPlatform.js";
export type { AwsLambdaStreamInvocation } from "./AwsLambdaStreamKernelPlatform.js";
export { LambdaWebKernelPlatform } from "./LambdaWebKernelPlatform.js";
export * from "./streaming/awslambda.js";

export * from "./abstractions/index.js";
export * from "./inputTypes/index.js";

export { InputHandler, InputType, Container, Abstraction } from "@webiny/api-kernel-core";
export type {
    IHttpRequest,
    IHttpResponse,
    NextFunction,
    KernelSetup,
    InputContext
} from "@webiny/api-kernel-core";
export * from "./translators/apiGatewayEventToHttpRequest.js";
export * from "./translators/httpResponseToApiGatewayResult.js";
export * from "./translators/functionUrlEventToHttpRequest.js";
export * from "./handlers/index.js";
export * from "./features/S3Feature.js";
export * from "./features/ApiGatewayFeature.js";
export * from "./features/FunctionUrlStreamFeature.js";

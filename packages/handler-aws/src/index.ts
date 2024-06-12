import "./gateway/register";
import "./s3/register";
import "./dynamodb/register";
import "./sqs/register";
import "./eventBridge/register";
import "./sns/register";

export * from "./utils";

/**
 * API Gateway
 */
export {
    createHandler as createApiGatewayHandler,
    HandlerParams as CreateApiGatewayHandlerParams,
    HandlerCallable as ApiGatewayHandlerCallable,
    RoutePlugin,
    createRoute as createApiGatewayRoute
} from "~/gateway";

/**
 * S3
 */
//
export {
    createHandler as createS3Handler,
    HandlerParams as CreateS3HandlerParams,
    S3EventHandler,
    S3EventHandlerCallable,
    S3EventHandlerCallableParams,
    createEventHandler as createS3EventHandler
} from "~/s3";

/**
 * DynamoDB Stream
 */
//
export {
    createHandler as createDynamoDBHandler,
    HandlerParams as CreateDynamoDBHandlerParams,
    DynamoDBEventHandler,
    DynamoDBEventHandlerCallable,
    DynamoDBEventHandlerCallableParams,
    createEventHandler as createDynamoDBEventHandler
} from "~/dynamodb";

/**
 * SQS
 */
//
export {
    createHandler as createSQSHandler,
    HandlerParams as CreateSQSHandlerParams,
    SQSEventHandler,
    SQSEventHandlerCallable,
    SQSEventHandlerCallableParams,
    createEventHandler as createSQSEventHandler
} from "~/sqs";

/**
 * SNS
 */
//
export {
    createHandler as createSNSHandler,
    HandlerParams as CreateSNSHandlerParams,
    SNSEventHandler,
    SNSEventHandlerCallable,
    SNSEventHandlerCallableParams,
    createEventHandler as createSNSEventHandler
} from "~/sns";

/**
 * EventBridge
 */
//
export {
    createHandler as createEventBridgeHandler,
    HandlerParams as CreateEventBridgeHandlerParams,
    EventBridgeEventHandler,
    EventBridgeEventHandlerCallable,
    EventBridgeEventHandlerCallableParams,
    createEventHandler as createEventBridgeEventHandler
} from "~/eventBridge";

export {
    createHandler as createRawHandler,
    CreateHandlerParams as CreateRawHandlerParams,
    HandlerCallable as RawHandlerCallable,
    createEventHandler as createRawEventHandler,
    RawEventHandlerCallableParams,
    RawEventHandlerCallable,
    RawEventHandler
} from "~/raw";

export { ContextPlugin, createContextPlugin, ContextPluginCallable } from "@webiny/handler";

export * from "./createHandler";
export * from "./sourceHandler";

/**
 * @cloudi/aws - DI-enabled cloud (AWS Lambda) functions
 *
 * Write cloud (AWS Lambda) functions using Dependency Injection.
 */

// Core
export { createFunction, CloudFunction } from "./createFunction.js";
export type { FunctionSetup, FunctionHandler, CreateFunctionOptions } from "./types.js";

// API Gateway
export {
    ApiGatewayFunction,
    createApiGatewayFunction,
    type APIGatewayEvent,
    type APIGatewayProxyResult
} from "./apiGateway/index.js";

// EventBridge
export {
    EventBridgeFunction,
    createEventBridgeFunction,
    type EventBridgeEvent,
    type EventBridgeResult
} from "./eventBridge/index.js";

// SQS
export {
    SqsFunction,
    createSqsFunction,
    type SQSEvent,
    type SQSRecord,
    type SqsResult
} from "./sqs/index.js";

// S3
export {
    S3Function,
    createS3Function,
    type S3Event,
    type S3EventRecord,
    type S3Result
} from "./s3/index.js";

// DynamoDB
export {
    DynamoDBFunction,
    createDynamoDBFunction,
    type DynamoDBStreamEvent,
    type DynamoDBRecord,
    type DynamoDBResult
} from "./dynamodb/index.js";

// SNS
export {
    SnsFunction,
    createSnsFunction,
    type SNSEvent,
    type SNSEventRecord,
    type SnsResult
} from "./sns/index.js";

// Raw/Generic
export { RawFunction, createRawFunction } from "./raw/index.js";

// Re-export Container from @webiny/di for convenience
export { Container } from "@webiny/di";


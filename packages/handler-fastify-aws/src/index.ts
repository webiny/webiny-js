export {
    createHandler as createApiGatewayHandler,
    CreateHandlerParams as CreateApiGatewayHandlerParams,
    RoutePlugin
} from "~/gateway";

export {
    createHandler as createS3Handler,
    CreateHandlerParams as CreateS3HandlerParams,
    S3EventHandler,
    S3EventHandlerCallable,
    S3EventHandlerCallableParams,
    createS3EventHandler
} from "~/s3";

export {
    createHandler as createPayloadHandler,
    CreateHandlerParams as CreatePayloadHandlerParams,
    PayloadEventHandler,
    PayloadEventHandlerCallable,
    PayloadHandlerCallableParams,
    createEventHandler as createPayloadEventHandler,
    HandlerCallable as PayloadHandlerCallable
} from "~/payload";

export {
    createHandler as createDynamoDBHandler,
    CreateHandlerParams as CreateDynamoDBHandlerParams,
    DynamoDBEventHandler,
    DynamoDBEventHandlerCallable,
    DynamoDBEventHandlerCallableParams,
    createEventHandler as createDynamoDBEventHandler,
    HandlerCallable as DynamoDBHandlerCallable
} from "~/dynamodb";

import {
    createHandler as createApiGatewayHandler,
    CreateHandlerParams as CreateApiGatewayHandlerParams,
    RoutePlugin
} from "~/gateway";
import {
    createHandler as createS3Handler,
    CreateHandlerParams as CreateS3HandlerParams,
    S3EventHandler,
    S3EventHandlerCallable,
    S3EventHandlerCallableParams,
    createS3EventHandler
} from "~/s3";

import {
    createHandler as createPayloadHandler,
    CreateHandlerParams as CreatePayloadHandlerParams,
    PayloadEventHandler,
    PayloadEventHandlerCallable,
    PayloadHandlerCallableParams,
    createEventHandler as createPayloadEventHandler,
    HandlerCallable as PayloadHandlerCallable
} from "~/payload";

export {
    createApiGatewayHandler,
    createS3Handler,
    createPayloadHandler,
    createS3EventHandler,
    createPayloadEventHandler,
    S3EventHandler,
    PayloadEventHandler,
    RoutePlugin
};
export type {
    CreateApiGatewayHandlerParams,
    CreateS3HandlerParams,
    S3EventHandlerCallable,
    S3EventHandlerCallableParams,
    CreatePayloadHandlerParams,
    PayloadEventHandlerCallable,
    PayloadHandlerCallableParams,
    PayloadHandlerCallable
};

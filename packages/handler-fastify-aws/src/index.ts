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
    createHandler as createRawHandler,
    CreateHandlerParams as CreateRawHandlerParams,
    RawEventHandler,
    RawEventHandlerCallable,
    RawEventHandlerCallableParams,
    createRawEventHandler,
    HandlerCallable as RawHandlerCallable
} from "~/raw";

export {
    createApiGatewayHandler,
    createS3Handler,
    createRawHandler,
    createS3EventHandler,
    createRawEventHandler,
    S3EventHandler,
    RawEventHandler,
    RoutePlugin
};
export type {
    CreateApiGatewayHandlerParams,
    CreateS3HandlerParams,
    S3EventHandlerCallable,
    S3EventHandlerCallableParams,
    CreateRawHandlerParams,
    RawEventHandlerCallable,
    RawEventHandlerCallableParams,
    RawHandlerCallable
};

import { CloudFrontRequestHandler, CloudFrontResponseHandler } from "./types";

declare const global: typeof globalThis & {
    // CloudFront Functions use global handler value, not exports.
    handler: Function;
};

/**
 * Helper function to easier define CloudFront Function request handler.
 *
 * Lambdas use exports, but CloudFront Functions use a global `handler` variable.
 * This way you only have to run the function within your handler script,
 * and you are provided with working handler and full typing.
 **/
export function defineCloudfrontFunctionRequestHandler(handler: CloudFrontRequestHandler) {
    global.handler = handler;
}

/**
 * Helper function to easier define CloudFront Function response handler.
 *
 * Lambdas use exports, but CloudFront Functions use a global `handler` variable.
 * This way you only have to run the function within your handler script,
 * and you are provided with working handler and full typing.
 **/
export function defineCloudfrontFunctionResponseHandler(handler: CloudFrontResponseHandler) {
    global.handler = handler;
}

import { CloudFrontRequestHandler, CloudFrontResponseHandler } from "./types";

declare const global: typeof globalThis & {
    handler: Function;
};

export function defineCloudfrontFunctionRequestHandler(handler: CloudFrontRequestHandler) {
    global.handler = handler;
}

export function defineCloudfrontFunctionResponseHandler(handler: CloudFrontResponseHandler) {
    global.handler = handler;
}

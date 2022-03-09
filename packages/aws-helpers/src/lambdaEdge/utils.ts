import { CloudFrontRequestHandler, CloudFrontResponseHandler } from "aws-lambda";

export function defineLambdaEdgeRequestHandler(handler: CloudFrontRequestHandler) {
    return handler;
}

export function defineLambdaEdgeResponseHandler(handler: CloudFrontResponseHandler) {
    return handler;
}

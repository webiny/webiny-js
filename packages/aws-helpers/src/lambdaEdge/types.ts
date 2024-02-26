import type {
    CloudFrontEvent as BaseCloudFrontEvent,
    CloudFrontRequest as BaseCloudFrontRequest,
    CloudFrontRequestEvent as BaseCloudFrontRequestEvent,
    CloudFrontResponse as BaseCloudFrontResponse,
    CloudFrontResponseEvent as BaseCloudFrontResponseEvent,
    CloudFrontResultResponse as BaseCloudFrontResultResponse,
    CloudFrontHeaders as BaseCloudFrontHeaders
} from "aws-lambda";

export type CloudFrontEvent = BaseCloudFrontEvent;
export type CloudFrontRequest = BaseCloudFrontRequest;
export type CloudFrontRequestEvent = BaseCloudFrontRequestEvent;
export type CloudFrontResponse = BaseCloudFrontResponse & { body?: string };
export type CloudFrontResponseEvent = BaseCloudFrontResponseEvent;
export type CloudFrontResultResponse = BaseCloudFrontResultResponse;
export type CloudFrontHeaders = BaseCloudFrontHeaders;

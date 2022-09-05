import * as awsLambda from "aws-lambda";

// We have to re-export types one by one.
// Otherwise `aws-lambda` will land in JS output.

export type CloudFrontEvent = awsLambda.CloudFrontEvent;
export type CloudFrontRequest = awsLambda.CloudFrontRequest;
export type CloudFrontRequestEvent = awsLambda.CloudFrontRequestEvent;
export type CloudFrontResponse = awsLambda.CloudFrontResponse & { body?: string };
export type CloudFrontResponseEvent = awsLambda.CloudFrontResponseEvent;
export type CloudFrontResultResponse = awsLambda.CloudFrontResultResponse;
export type CloudFrontHeaders = awsLambda.CloudFrontHeaders;

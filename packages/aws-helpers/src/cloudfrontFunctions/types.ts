// These are types for CloudFront Functions.
// They differ from Lambda@Edge types.
// See also: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html

export interface SingleValue {
    value: string;
}

export interface Header extends SingleValue {
    key: string;
}

export interface ResponseCookie extends SingleValue {
    attributes?: string;
}

/**
 * In principle you may have multiple same headers and cookies in one request or response.
 * This is a wrapper interface for simpler use.
 */
export type MultiValue<T> = T & {
    /** Additional values for the same item (for example multiple values for the same cookie.) */
    multivalue?: T[];
};

export type MultiValueDictionary<T> = Record<string, MultiValue<T> | undefined>;

export type CloudFrontHeaders = MultiValueDictionary<SingleValue>;
export type CloudFrontRequestCookies = MultiValueDictionary<SingleValue>;
export type CloudFrontResponseCookies = MultiValueDictionary<ResponseCookie>;
export type CloudFrontQuery = MultiValueDictionary<SingleValue>;

/**
 * Interface type for request in CloudFront Functions
 * see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html
 */
export interface CloudFrontRequest {
    method: string;
    uri: string;
    querystring?: CloudFrontQuery;
    headers: CloudFrontHeaders;
    cookies?: CloudFrontRequestCookies;
}

/**
 * Interface type for response in CloudFront Functions
 * see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html
 */
export interface CloudFrontResponse {
    statusCode: number;
    statusDescription?: string;
    headers: CloudFrontHeaders;
    cookies?: CloudFrontResponseCookies;
}

/**
 * Interface type for request event in CloudFront Functions
 * see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html
 */
export interface CloudFrontRequestEvent {
    version: string;
    context: {
        eventType: "viewer-request";
    };
    viewer: {
        ip: string;
    };
    request: CloudFrontRequest;
}

/**
 * Interface type for response event in CloudFront Functions
 * see: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html
 */
export interface CloudFrontResponseEvent {
    version: string;
    context: {
        eventType: "viewer-response";
    };
    viewer: {
        ip: string;
    };
    response: CloudFrontResponse;
    request: CloudFrontRequest;
}

export interface CloudFrontRequestHandler {
    (event: CloudFrontRequestEvent): CloudFrontRequest | CloudFrontResponse;
}

export interface CloudFrontResponseHandler {
    (event: CloudFrontResponseEvent): CloudFrontResponse;
}

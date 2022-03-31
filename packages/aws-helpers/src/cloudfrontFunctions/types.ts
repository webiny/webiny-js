export interface Header {
    key: string;
    value: string;
}

export interface SingleValue {
    value: string;
}

export interface ResponseCookie extends SingleValue {
    attributes?: string;
}

export interface MultiValue<T> {
    multivalue?: T[];
}

export type MultiValueDictionary<T> = Record<string, (T & MultiValue<T>) | undefined>;

export type CloudFrontHeaders = MultiValueDictionary<SingleValue>;
export type CloudFrontRequestCookies = MultiValueDictionary<SingleValue>;
export type CloudFrontResponseCookies = MultiValueDictionary<ResponseCookie>;
export type CloudFrontQuery = MultiValueDictionary<SingleValue>;

export interface CloudFrontRequest {
    method: string;
    uri: string;
    querystring?: CloudFrontQuery;
    headers: CloudFrontHeaders;
    cookies?: CloudFrontRequestCookies;
}

export interface CloudFrontResponse {
    statusCode: number;
    statusDescription?: string;
    headers: CloudFrontHeaders;
    cookies?: CloudFrontResponseCookies;
}

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

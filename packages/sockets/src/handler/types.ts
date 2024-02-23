import { HandlerFactoryParams } from "@webiny/handler-aws/types";
import { ISocketsEventValidator } from "~/validator";
import { ISocketsResponse } from "~/response";
import { PartialDeep } from "type-fest";
import { APIGatewayProxyResult, Context as LambdaContext } from "aws-lambda";

export interface HandlerCallable {
    (event: ISocketsEventPartial, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface HandlerParams extends HandlerFactoryParams {
    validator?: ISocketsEventValidator;
    response?: ISocketsResponse;
}

export enum SocketsEventRoute {
    "connect" = "$connect",
    "disconnect" = "$disconnect",
    "default" = "$default"
}

export interface ISocketsEventData {
    token?: string;
    tenant?: string;
    locale?: string;
}

export enum SocketsEventRequestContextEventType {
    "message" = "MESSAGE",
    "connect" = "CONNECT",
    "disconnect" = "DISCONNECT"
}

export interface ISocketsEventRequestContextAuthorizer {
    principalId?: string;
}

export interface ISocketsEventRequestContextError {
    messageString?: string;
    validationErrorString?: string;
}

export interface ISocketsEventRequestContextIdentity {
    accountId?: string;
    apiKey?: string;
    apiKeyId?: string;
    caller?: string;
    cognitoAuthenticationProvider?: string;
    cognitoAuthenticationType?: string;
    cognitoIdentityId?: string;
    cognitoIdentityPoolId?: string;
    user?: string;
    userArn?: string;
    sourceIp: string;
    userAgent: string;
}

export interface ISocketsEventRequestContext {
    connectionId: string;
    connectedAt: number;
    domainName: string;
    eventType: SocketsEventRequestContextEventType;
    messageId?: string;
    routeKey: SocketsEventRoute | string;
    requestId: string;
    extendedRequestId: string;
    apiId: string;
    authorizer?: ISocketsEventRequestContextAuthorizer;
    error?: ISocketsEventRequestContextError;
    identity: ISocketsEventRequestContextIdentity;
    requestTime: string;
    requestTimeEpoch: number;
    stage: string;
    status?: number;
    messageDirection: string;
}

export interface ISocketsEventHeaders {
    "Accept-Encoding"?: string;
    "Accept-Language"?: string;
    "Cache-Control"?: string;
    Host?: string;
    Origin?: string;
    Pragma?: string;
    "Sec-WebSocket-Extensions"?: string;
    "Sec-WebSocket-Key"?: string;
    "Sec-WebSocket-Version"?: string;
    "Sec-WebSocket-Protocol"?: string;
    "User-Agent"?: string;
    "X-Amzn-Trace-Id"?: string;
    "X-Forwarded-For"?: string;
    "X-Forwarded-Port"?: `${number}`;
    "X-Forwarded-Proto"?: "https" | "http";
    ["x-tenant"]?: string;
    ["x-webiny-cms-locale"]?: string;
    ["x-webiny-cms-endpoint"]?: string;
}

export interface ISocketsEventQueryStringParameters {
    tenant?: string;
    locale?: string;
    token?: string;
}

export interface ISocketsEvent<T extends ISocketsEventData = ISocketsEventData> {
    headers?: ISocketsEventHeaders;
    queryStringParameters?: ISocketsEventQueryStringParameters;
    requestContext: ISocketsEventRequestContext;
    body?: T;
}

export type ISocketsEventPartial = PartialDeep<ISocketsEvent>;

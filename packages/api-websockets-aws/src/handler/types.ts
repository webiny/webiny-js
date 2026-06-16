import type { HandlerFactoryParams } from "@webiny/handler-aws/types.js";
import type { IWebsocketsResponse } from "@webiny/api-websockets/response/abstractions/IWebsocketsResponse.js";
import type {
    APIGatewayProxyResult,
    Context as LambdaContext
} from "@webiny/aws-sdk/types/index.js";
import type { IWebsocketsEventData } from "@webiny/api-websockets";
import type { GenericRecord } from "@webiny/api/types.js";
import type { PartialDeep } from "type-fest";

export interface HandlerCallable {
    (event: IAwsWebsocketsIncomingEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface HandlerParams extends HandlerFactoryParams {
    response?: IWebsocketsResponse;
}

export enum WebsocketsEventRoute {
    "connect" = "$connect",
    "disconnect" = "$disconnect",
    "default" = "$default"
}

export enum WebsocketsEventRequestContextEventType {
    "message" = "MESSAGE",
    "connect" = "CONNECT",
    "disconnect" = "DISCONNECT"
}

export interface IAwsWebsocketsEventRequestContext {
    connectionId: string;
    connectedAt: number;
    domainName: string;
    eventType: WebsocketsEventRequestContextEventType;
    routeKey: WebsocketsEventRoute | string;
    stage: string;
}

export interface IAwsWebsocketsEventHeaders {
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
    ["x-webiny-cms-endpoint"]?: string;
}

export interface IAwsWebsocketsEventQueryStringParameters {
    tenant?: string;
    token?: string;
}

export interface IAwsWebsocketsEvent<T extends IWebsocketsEventData = IWebsocketsEventData> {
    headers?: IAwsWebsocketsEventHeaders;
    queryStringParameters?: IAwsWebsocketsEventQueryStringParameters;
    requestContext: IAwsWebsocketsEventRequestContext;
    body?: T;
}

export interface IAwsWebsocketsIncomingEvent extends PartialDeep<
    Omit<IAwsWebsocketsEvent, "body">
> {
    body?: string | GenericRecord;
}

import { HandlerFactoryParams } from "@webiny/handler-aws/types";
import { IWebsocketsEventValidator } from "~/validator";
import { IWebsocketsResponse } from "~/response";
import { APIGatewayProxyResult, Context as LambdaContext } from "aws-lambda";
import { GenericRecord } from "@webiny/api/types";
import { PartialDeep } from "type-fest";

export interface HandlerCallable {
    (event: IWebsocketsIncomingEvent, context: LambdaContext): Promise<APIGatewayProxyResult>;
}

export interface HandlerParams extends HandlerFactoryParams {
    validator?: IWebsocketsEventValidator;
    response?: IWebsocketsResponse;
}

export enum WebsocketsEventRoute {
    "connect" = "$connect",
    "disconnect" = "$disconnect",
    "default" = "$default"
}

export interface IWebsocketsEventData {
    token?: string;
    tenant?: string;
    locale?: string;
    messageId?: string;
    action?: string;
    data?: GenericRecord;
}

export enum WebsocketsEventRequestContextEventType {
    "message" = "MESSAGE",
    "connect" = "CONNECT",
    "disconnect" = "DISCONNECT"
}

export interface IWebsocketsEventRequestContext {
    connectionId: string;
    connectedAt: number;
    domainName: string;
    eventType: WebsocketsEventRequestContextEventType;
    routeKey: WebsocketsEventRoute | string;
    stage: string;
}

export interface IWebsocketsEventHeaders {
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

export interface IWebsocketsEventQueryStringParameters {
    tenant?: string;
    locale?: string;
    token?: string;
}

export interface IWebsocketsEvent<T extends IWebsocketsEventData = IWebsocketsEventData> {
    headers?: IWebsocketsEventHeaders;
    queryStringParameters?: IWebsocketsEventQueryStringParameters;
    requestContext: IWebsocketsEventRequestContext;
    body?: T;
}

export interface IWebsocketsIncomingEvent extends PartialDeep<Omit<IWebsocketsEvent, "body">> {
    body?: string | GenericRecord;
}

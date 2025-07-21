import type {
    AttributeValue,
    DynamoDBRecord,
    APIGatewayEvent,
    APIGatewayEventRequestContextWithAuthorizer,
    Context as LambdaContext,
    DynamoDBStreamEvent,
    EventBridgeEvent,
    S3Event,
    SNSEvent,
    SQSEvent
} from "@webiny/aws-sdk/types";
import "fastify";
import type { CreateHandlerParams as BaseCreateHandlerParams } from "@webiny/handler";
import type { LambdaFastifyOptions as LambdaOptions } from "@fastify/aws-lambda";

export type { AttributeValue, DynamoDBRecord };

export { HandlerRegistry } from "~/registry";

export * from "@webiny/handler/types";

export type { APIGatewayEvent, LambdaContext, APIGatewayEventRequestContextWithAuthorizer };

export type HandlerEvent =
    | APIGatewayEvent
    | SNSEvent
    | SQSEvent
    | S3Event
    | EventBridgeEvent<string, string>
    | DynamoDBStreamEvent
    | unknown;

export interface EventResolver<T = any> {
    (event: HandlerEvent, context: LambdaContext): T;
}

export interface HandlerFactoryParams extends BaseCreateHandlerParams {
    lambdaOptions?: LambdaOptions;
}

export interface HandlerFactory<T extends HandlerFactoryParams = HandlerFactoryParams, R = any> {
    (params: T): EventResolver<R>;
}

export interface HandlerParams<E, P extends HandlerFactoryParams> {
    params: P;
    event: E;
    context: LambdaContext;
}

export interface SourceHandler<
    E = HandlerEvent,
    P extends HandlerFactoryParams = HandlerFactoryParams,
    T = any
> {
    name: string;
    canUse: (event: Partial<E>, context: LambdaContext) => boolean;
    handle: (params: HandlerParams<E, P>) => Promise<T>;
}

export enum Base64EncodeHeader {
    encoded = "x-webiny-base64-encoded",
    binary = "x-webiny-binary"
}

declare module "fastify" {
    interface FastifyInstance {
        __webiny_raw_result: any;
    }
    interface FastifyRequest {
        awsLambda: {
            event: APIGatewayEvent;
            context: LambdaContext;
        };
    }
}

import type {
    APIGatewayEvent,
    APIGatewayEventRequestContextWithAuthorizer,
    AttributeValue,
    Context as LambdaContext,
    DynamoDBRecord,
    DynamoDBStreamEvent,
    EventBridgeEvent,
    S3Event,
    SNSEvent,
    SQSEvent
} from "@webiny/aws-sdk/types/index.js";
import type { GenericRecord } from "@webiny/utils";

export type { AttributeValue, DynamoDBRecord };
export type { APIGatewayEvent, LambdaContext, APIGatewayEventRequestContextWithAuthorizer };

export type HandlerEvent =
    | APIGatewayEvent
    | SNSEvent
    | SQSEvent
    | S3Event
    | EventBridgeEvent<string, string>
    | DynamoDBStreamEvent
    | GenericRecord<string>;

export enum Base64EncodeHeader {
    encoded = "x-webiny-base64-encoded",
    binary = "x-webiny-binary"
}

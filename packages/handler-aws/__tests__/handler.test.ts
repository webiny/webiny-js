import {
    DynamoDBStreamEvent,
    EventBridgeEvent,
    S3Event,
    S3EventRecord,
    SNSEvent,
    SQSEvent,
    SQSRecord
} from "aws-lambda";
import {
    createDynamoDBEventHandler,
    createEventBridgeEventHandler,
    createHandler,
    createS3EventHandler,
    createSNSEventHandler,
    createSQSEventHandler
} from "~/index";
import { LambdaContext } from "~/types";

describe("main handler", () => {
    const context = {} as LambdaContext;

    const plugins = [
        createS3EventHandler(async () => {
            return {
                isS3Event: true
            };
        }),
        createDynamoDBEventHandler(async () => {
            return {
                isDynamoDBEvent: true
            };
        }),
        createSQSEventHandler(async () => {
            return {
                isSQSEvent: true
            };
        }),
        createSNSEventHandler(async () => {
            return {
                isEventBridgeEvent: true
            };
        }),
        createEventBridgeEventHandler(async () => {
            return {
                isEventBridgeEvent: true
            };
        })
    ];

    it("should select s3 handler for the s3 event", async () => {
        const handler = createHandler({
            plugins
        });

        const event: S3Event = {
            Records: [
                {
                    s3: {}
                } as S3EventRecord
            ]
        };

        const result = await handler(event, context);

        expect(result).toEqual({
            isS3Event: true
        });
    });

    it("should select DynamoDB handler for the DynamoDB stream event", async () => {
        const handler = createHandler({
            plugins
        });

        const event: DynamoDBStreamEvent = {
            Records: [
                {
                    eventSource: "aws:dynamodb"
                }
            ]
        };

        const result = await handler(event, context);

        expect(result).toEqual({
            isDynamoDBEvent: true
        });
    });

    it("should select SQSEvent handler for the SQSEvent stream event", async () => {
        const handler = createHandler({
            plugins
        });

        const event: SQSEvent = {
            Records: [
                {
                    eventSource: "aws:sqs"
                } as SQSRecord
            ]
        };

        const result = await handler(event, context);

        expect(result).toEqual({
            isSQSEvent: true
        });
    });

    it("should select EventBridgeEvent handler for the EventBridgeEvent stream event", async () => {
        const handler = createHandler({
            plugins
        });

        const event = {
            source: "aws:something"
        } as EventBridgeEvent<string, string>;

        const result = await handler(event, context);

        expect(result).toEqual({
            isEventBridgeEvent: true
        });
    });

    it("should select SNSEvent handler for the SNSEvent stream event", async () => {
        const handler = createHandler({
            plugins
        });

        const event = {
            Records: [
                {
                    Sns: {}
                }
            ]
        } as SNSEvent;

        const result = await handler(event, context);

        expect(result).toEqual({
            isEventBridgeEvent: true
        });
    });
});

import {
    DynamoDBStreamEvent,
    EventBridgeEvent,
    S3Event,
    S3EventRecord,
    SQSEvent,
    SQSRecord
} from "aws-lambda";
import { createHandler } from "~/createHandler";
import {
    createDynamoDBEventHandler,
    createEventBridgeEventHandler,
    createS3EventHandler,
    createSQSEventHandler
} from "~/index";
import { LambdaContext } from "~/types";

interface S3EventHandlerResponse {
    isS3MainEventHandler?: boolean;
    isAnotherS3EventHandler?: boolean;
}

interface DynamoDBEventHandlerResponse {
    isDynamoDBEvent?: boolean;
    isAnotherDynamoDBEvent?: boolean;
}

interface SQSEventHandlerResponse {
    isSQSEvent?: boolean;
    isAnotherSQSEvent?: boolean;
}

describe("composed event handlers", () => {
    const context = {} as LambdaContext;

    const plugins = [
        /**
         * S3
         */
        createS3EventHandler<S3EventHandlerResponse>(async () => {
            return {
                isS3MainEventHandler: true
            };
        }),
        createS3EventHandler<S3EventHandlerResponse>(async ({ next }) => {
            const result = await next();
            return {
                ...result,
                isAnotherS3EventHandler: true
            };
        }),
        /**
         * DynamoDB
         */
        createDynamoDBEventHandler<DynamoDBEventHandlerResponse>(async () => {
            return {
                isDynamoDBEvent: true
            };
        }),
        createDynamoDBEventHandler<DynamoDBEventHandlerResponse>(async ({ next }) => {
            const result = await next();
            return {
                ...result,
                isAnotherDynamoDBEvent: true
            };
        }),
        /**
         * SQS Event
         */
        createSQSEventHandler<SQSEventHandlerResponse>(async () => {
            return {
                isSQSEvent: true
            };
        }),
        createSQSEventHandler<SQSEventHandlerResponse>(async ({ next }) => {
            const result = await next();
            return {
                ...result,
                isAnotherSQSEvent: true
            };
        }),
        /**
         * Event Bridge Event
         */
        createEventBridgeEventHandler(async () => {
            return {
                isEventBridgeEvent: true
            };
        }),
        createEventBridgeEventHandler(async ({ next }) => {
            const result = await next();
            return {
                ...result,
                isAnotherEventBridgeEvent: true
            };
        })
    ];

    it("should be possible to execute multiple event handlers for a single event using next() callback - s3", async () => {
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
            isS3MainEventHandler: true,
            isAnotherS3EventHandler: true
        });
    });

    it("should be possible to execute multiple event handlers for a single event using next() callback - dynamodb stream", async () => {
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
            isDynamoDBEvent: true,
            isAnotherDynamoDBEvent: true
        });
    });

    it("should be possible to execute multiple event handlers for a single event using next() callback - sqs", async () => {
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
            isSQSEvent: true,
            isAnotherSQSEvent: true
        });
    });

    it("should be possible to execute multiple event handlers for a single event using next() callback - event bridge", async () => {
        const handler = createHandler({
            plugins
        });

        const event = {
            source: "aws:something"
        } as EventBridgeEvent<string, string>;

        const result = await handler(event, context);

        expect(result).toEqual({
            isEventBridgeEvent: true,
            isAnotherEventBridgeEvent: true
        });
    });
});

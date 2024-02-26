import {
    DynamoDBStreamEvent,
    EventBridgeEvent,
    S3Event,
    S3EventRecord,
    SNSEvent,
    SQSEvent,
    SQSRecord
} from "aws-lambda";
import { createHandler } from "~/createHandler";
import {
    createDynamoDBEventHandler,
    createEventBridgeEventHandler,
    createS3EventHandler,
    createSNSEventHandler,
    createSQSEventHandler
} from "~/index";
import { LambdaContext } from "~/types";

interface S3EventHandlerResponse {
    isS3MainEventHandler?: boolean;
    isAnotherS3EventHandler?: boolean;
    isThirdS3EventHandler?: boolean;
    isFourthS3EventHandler?: boolean;
}

interface DynamoDBEventHandlerResponse {
    isDynamoDBEvent?: boolean;
    isAnotherDynamoDBEvent?: boolean;
}

interface SQSEventHandlerResponse {
    isSQSEvent?: boolean;
    isAnotherSQSEvent?: boolean;
}

interface SNSEventHandlerResponse {
    isSNSEvent?: boolean;
    isAnotherSNSEvent?: boolean;
}

describe("composed event handlers", () => {
    const context = {} as LambdaContext;

    const calledS3EventHandlers: number[] = [];

    const plugins = [
        /**
         * S3
         */
        createS3EventHandler<S3EventHandlerResponse>(async () => {
            calledS3EventHandlers.push(1);
            return {
                isS3MainEventHandler: true
            };
        }),
        createS3EventHandler<S3EventHandlerResponse>(async ({ next }) => {
            const result = await next();
            calledS3EventHandlers.push(2);
            return {
                ...result,
                isAnotherS3EventHandler: true
            };
        }),
        createS3EventHandler<S3EventHandlerResponse>(async ({ next }) => {
            const result = await next();
            calledS3EventHandlers.push(3);
            return {
                ...result,
                isThirdS3EventHandler: true
            };
        }),
        createS3EventHandler<S3EventHandlerResponse>(async ({ next }) => {
            const result = await next();
            calledS3EventHandlers.push(4);
            return {
                ...result,
                isFourthS3EventHandler: true
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
        }),
        /**
         * SNS
         */
        createSNSEventHandler<SNSEventHandlerResponse>(async () => {
            return {
                isSNSEvent: true
            };
        }),
        createSNSEventHandler<SNSEventHandlerResponse>(async ({ next }) => {
            const result = await next();
            return {
                ...result,
                isAnotherSNSEvent: true
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
            isAnotherS3EventHandler: true,
            isThirdS3EventHandler: true,
            isFourthS3EventHandler: true
        });

        expect(calledS3EventHandlers[0]).toEqual(1);
        expect(calledS3EventHandlers[1]).toEqual(2);
        expect(calledS3EventHandlers[2]).toEqual(3);
        expect(calledS3EventHandlers[3]).toEqual(4);
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

    it("should be possible to execute multiple event handlers for a single event using next() callback - sns", async () => {
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
            isSNSEvent: true,
            isAnotherSNSEvent: true
        });
    });
});

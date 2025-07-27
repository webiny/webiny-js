import type { SQSMessageAttributes, SQSRecord, SQSRecordAttributes } from "@webiny/aws-sdk/types";
import { SQSEvent } from "@webiny/aws-sdk/types/index.js";
import { createMockSystem } from "~tests/mocks/system.js";
import { generateAlphaNumericId } from "@webiny/utils/generateId.js";

export const createMockSQSEventRecord = (input: Partial<SQSRecord> = {}): SQSRecord => {
    const attributes: SQSRecordAttributes = {
        AWSTraceHeader: "tracerHeader",
        ApproximateReceiveCount: "0",
        SentTimestamp: "1234",
        SenderId: "1234",
        ApproximateFirstReceiveTimestamp: "1234",
        SequenceNumber: "1234",
        MessageGroupId: "1234",
        MessageDeduplicationId: "1234",
        DeadLetterQueueSourceArn: "1234",
        ...input.attributes
    };
    const messageAttributes: SQSMessageAttributes = {
        ...input.messageAttributes
    };
    return {
        messageId: "messageid1234",
        receiptHandle: "receiptHandle1234",
        body: "a body",
        md5OfBody: "1234",
        md5OfMessageAttributes: "1234",
        eventSource: "1234",
        eventSourceARN: "1234",
        awsRegion: "eu-central-1",
        ...input,
        attributes,
        messageAttributes
    };
};

export const createMockSQSEvent = (): SQSEvent => {
    return {
        Records: [
            createMockSQSEventRecord({
                body: JSON.stringify({
                    version: "1",
                    id: "something",
                    "detail-type": "synchronization-input",
                    source: "webiny:testing",
                    account: "1234",
                    time: "something",
                    region: "eu-central-1",
                    resources: [],
                    detail: {
                        id: generateAlphaNumericId(),
                        items: [
                            {
                                tableName: process.env.DB_TABLE,
                                tableType: "regular",
                                PK: "pk1",
                                SK: "sk1",
                                command: "put"
                            }
                        ],
                        source: createMockSystem({
                            env: "test",
                            variant: "blue"
                        })
                    },
                    eventBusName: "something"
                })
            })
        ]
    };
};

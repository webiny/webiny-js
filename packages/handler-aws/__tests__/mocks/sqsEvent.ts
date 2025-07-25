import type { SQSEvent, SQSRecord } from "@webiny/aws-sdk/types";

export const sqsEventRecord: SQSRecord = {
    messageId: "1234567890",
    receiptHandle: "AQEBwJn...",
    body: JSON.stringify({ key: "value" }),
    attributes: {
        ApproximateReceiveCount: "1",
        SentTimestamp: "1622547800000",
        SenderId: "123456789012",
        ApproximateFirstReceiveTimestamp: "1622547800001"
    },
    messageAttributes: {},
    md5OfBody: "d41d8cd98f00b204e9800998ecf8427e",
    eventSource: "aws:sqs",
    eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:my-queue",
    awsRegion: "us-east-1"
};

export const sqsEvent: SQSEvent = {
    Records: [sqsEventRecord]
};

export const createSQSEvent = (options: Partial<SQSEvent> = {}): SQSEvent => {
    return {
        Records: [sqsEventRecord],
        ...(options || {})
    };
};

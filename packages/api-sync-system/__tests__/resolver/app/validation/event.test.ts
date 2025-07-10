import { createEventValidation } from "~/resolver/app/validation/event.js";
import { createZodError } from "@webiny/utils/createZodError.js";

describe("validate event", () => {
    it("should not fail validation if records are empty", async () => {
        const validation = createEventValidation();

        const result = await validation.safeParseAsync([]);

        expect(result.success).toBeTrue();
        expect(result.error).toBeUndefined();
        expect(result.data).toEqual([]);
    });

    it("should fail validation if records array does not have correct schema", async () => {
        const validation = createEventValidation();

        const result = await validation.safeParseAsync([
            {
                messageId: "1",
                receiptHandle: "handle",
                body: JSON.stringify({
                    version: "1",
                    id: "id",
                    "detail-type": "unknown", // Invalid detail-type
                    source: "webiny:test",
                    account: "123456789012",
                    time: new Date().toISOString(),
                    region: "us-east-1",
                    resources: [],
                    detail: {}
                }),
                attributes: {
                    ApproximateReceiveCount: "1",
                    SentTimestamp: "1234567890",
                    SenderId: "sender-id",
                    ApproximateFirstReceiveTimestamp: "1234567890"
                },
                messageAttributes: {},
                md5OfBody: "md5",
                eventSource: "aws:sqs",
                eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
                awsRegion: "us-east-1"
            }
        ]);

        expect(result.success).toBeFalse();
        expect(result.error).toBeDefined();
        expect(result.data).toBeUndefined();

        // @ts-expect-error
        const error = createZodError(result.error);

        expect(error.data).toEqual({
            invalidFields: {
                "0.body.detail.items": {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: [0, "body", "detail", "items"]
                    }
                },
                "0.body.detail.source": {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: [0, "body", "detail", "source"]
                    }
                },
                "0.body.detail.id": {
                    code: "invalid_type",
                    message: "Required",
                    data: {
                        path: [0, "body", "detail", "id"]
                    }
                },
                "0.body.detail-type": {
                    code: "custom",
                    message: '"detail-type" must be "synchronization-input".',
                    data: {
                        path: [0, "body", "detail-type"]
                    }
                }
            }
        });
    });
});

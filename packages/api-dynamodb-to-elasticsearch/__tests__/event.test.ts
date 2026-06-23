import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { OpenSearchClient } from "@webiny/api-opensearch/features/OpenSearchClient/abstraction.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { marshall as baseMarshall } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DdbToEsLambdaHandler } from "~/DdbToEsLambdaHandler";
import { DynamoDBEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";

const marshall = (item: Record<string, any>): any => {
    return baseMarshall(item, {
        convertEmptyValues: true,
        removeUndefinedValues: true
    });
};

const record = {
    eventID: "123",
    dynamodb: {
        Keys: marshall({
            PK: "s1",
            SK: "s2"
        }),
        OldImage: marshall({
            data: {
                id: {
                    S: "1"
                },
                title: {
                    S: "T"
                }
            }
        }),
        NewImage: marshall({
            data: {
                id: {
                    S: "123"
                },
                title: {
                    S: "Test"
                }
            }
        })
    }
};

const mockOpenSearchClient = {
    use: () => ({
        bulk: vi.fn().mockResolvedValue({ body: { errors: false, items: [] } })
    })
};

const createHandler = (withOpenSearch = true) => {
    const container = new Container();
    container.registerInstance(RequestContainer, container);
    CompressionFeature.register(container);
    if (withOpenSearch) {
        container.registerInstance(OpenSearchClient, mockOpenSearchClient);
    }
    container.register(DdbToEsLambdaHandler);
    return container.resolve(DynamoDBEventHandler);
};

describe("event", () => {
    it("should handle event with no records", async () => {
        const handler = createHandler();

        const result = await handler.execute(
            { event: { Records: [] }, metadata: {} },
            vi.fn()
        );

        expect(result).toEqual({ success: true, processedRecords: 0 });
    });

    it("should handle event with a record missing eventName", async () => {
        const handler = createHandler();

        const result = await handler.execute(
            { event: { Records: [record as any] }, metadata: {} },
            vi.fn()
        );

        expect(result).toEqual({ success: true, processedRecords: 0 });
    });

    it("should return failure when opensearch client is missing", async () => {
        const handler = createHandler(false);

        const result = await handler.execute(
            { event: { Records: [record as any] }, metadata: {} },
            vi.fn()
        );

        expect(result).toEqual({ success: false, message: "Missing opensearch client." });
    });
});

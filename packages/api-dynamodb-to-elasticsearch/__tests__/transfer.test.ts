import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { OpenSearchClient } from "@webiny/api-opensearch/features/OpenSearchClient/abstraction.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { OperationType } from "~/index";
import { DdbToEsLambdaHandler } from "~/DdbToEsLambdaHandler";
import { DynamoDBEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import { marshall } from "@webiny/aws-sdk/client-dynamodb/index.js";

describe("transfer data", () => {
    it("should transfer data from event to opensearch", async () => {
        const elasticsearch = createTestOpenSearchClient();

        const container = new Container();
        container.registerInstance(RequestContainer, container);
        CompressionFeature.register(container);
        container.registerInstance(OpenSearchClient, { use: () => elasticsearch });
        container.register(DdbToEsLambdaHandler);

        const handler = container.resolve(DynamoDBEventHandler);

        const index = "a-test-index";
        elasticsearch.indices.registerIndex(index);

        const result = await handler.execute(
            {
                event: {
                    Records: [
                        {
                            eventName: OperationType.INSERT,
                            dynamodb: {
                                Keys: marshall({
                                    PK: "PK_TEST",
                                    SK: "SK_TEST"
                                }) as any,
                                NewImage: marshall({
                                    index,
                                    ignore: false,
                                    data: {
                                        title: "Hello World"
                                    }
                                }) as any
                            }
                        }
                    ]
                },
                metadata: {}
            },
            vi.fn()
        );

        expect(result).toEqual({ success: true, processedRecords: 1 });

        await elasticsearch.indices.deleteAll();
    });
});

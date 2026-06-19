import { describe, expect, it, vi } from "vitest";
import { createEventHandler, OperationType } from "~/index";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { LambdaContext, Reply, Request } from "@webiny/handler-aws/types";
import { marshall } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createMockContext } from "~tests/mocks/context";
import { PluginsContainer } from "@webiny/plugins";
import { registerOpenSearchCore } from "@webiny/api-opensearch";

describe("transfer data", () => {
    it("should transfer data from event to elasticsearch", async () => {
        const event = createEventHandler();

        const elasticsearch = createTestOpenSearchClient();

        const plugins = new PluginsContainer([registerOpenSearchCore(elasticsearch)]);

        const context = createMockContext({
            plugins
        });

        /**
         * Register index which is going to get created, so it can be deleted after the test.
         */
        const index = "a-test-index";
        elasticsearch.indices.registerIndex(index);

        const result = await event.cb({
            context,
            reply: {} as Reply,
            request: {} as Request,
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
            lambdaContext: {} as LambdaContext,
            next: vi.fn()
        });

        expect(result).toEqual(null);

        await elasticsearch.indices.deleteAll();
    });
});

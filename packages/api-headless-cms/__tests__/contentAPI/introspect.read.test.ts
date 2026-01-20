import { beforeEach, describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler.js";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

describe("cms read introspect query", () => {
    const manager = useGraphQLHandler({
        path: "manage"
    });
    const reader = useGraphQLHandler({
        path: "read"
    });

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: "*"
        });
    });

    it("should show proper field types for read introspect query", async () => {
        const [result] = await reader.introspect();

        expect(result.errors).toBeUndefined();
        expect(result).toMatchObject({
            data: {
                __schema: {
                    queryType: {
                        name: "Query"
                    },
                    mutationType: {
                        name: "Mutation"
                    },
                    subscriptionType: null,
                    types: expect.arrayContaining([
                        expect.objectContaining({
                            kind: expect.any(String),
                            name: expect.any(String)
                        })
                    ])
                }
            }
        });
    });
});

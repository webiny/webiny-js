import { beforeEach, describe, expect, it } from "vitest";
import { useArticleManageHandler } from "~tests/testHelpers/useArticleManageHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup.js";

describe("revision id scalar", () => {
    const manageHandlerOpts = { path: "manage" };

    const manager = useArticleManageHandler(manageHandlerOpts);
    const { createArticle } = manager;

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["article"]
        });
    });

    it("should fail when sending malformed revision id into the ref field", async () => {
        const [result] = await createArticle({
            data: {
                values: {
                    category: {
                        modelId: "category",
                        id: "abdefghijklmnopqrstuvwxyz"
                    }
                }
            }
        });
        const message = `Variable "$data" got invalid value "abdefghijklmnopqrstuvwxyz" at "data.values.category.id"; Expected type "RevisionId". RevisionId value must be a valid Revision ID property! Example: "abcdef#0001"`;
        expect(result).toMatchObject({
            errors: [
                {
                    message
                }
            ]
        });
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].message).toEqual(message);
    });
});

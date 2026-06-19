import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/graphql/handler";
import { createMockPlugins } from "~tests/converters/mocks";
import { createGlobalModifierPlugin } from "~tests/api/mocks/plugins";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

describe("missing index", () => {
    it("should return empty result set when index is missing", async () => {
        const { createContext } = useHandler({
            plugins: [...createMockPlugins(), createGlobalModifierPlugin()]
        });
        const context = await createContext();

        const opensearch = context.container.resolve(OpenSearchClient);

        const model = (await context.cms.getModel("converter")) as CmsModel;

        const config = configurations.es({
            model
        });

        const indexExistsResponse = await opensearch.use().indices.exists({
            index: config.index
        });

        expect(indexExistsResponse).toMatchObject({
            body: false,
            statusCode: 404,
            meta: {
                aborted: false,
                attempts: 0,
                connection: {
                    status: "alive"
                }
            }
        });

        const result = await context.cms.listLatestEntries(model, {});

        expect(result).toEqual([
            [],
            {
                cursor: null,
                hasMoreItems: false,
                totalCount: 0
            }
        ]);
    });
});

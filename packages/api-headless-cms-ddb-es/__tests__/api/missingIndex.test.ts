import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/graphql/handler";
import { createMockPlugins } from "~tests/converters/mocks";
import { createGlobalModifierPlugin } from "~tests/api/mocks/plugins";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";

describe("missing index", () => {
    it("should return empty result set when index is missing", async () => {
        const { createContext } = useHandler({
            plugins: [...createMockPlugins(), createGlobalModifierPlugin()]
        });
        const context = await createContext();

        const opensearch = context.container.resolve(OpenSearchClient);

        const modelResult = await context.container.resolve(GetModelUseCase).execute("converter");
        const model = modelResult.value as CmsModel;

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

        const listResult = await context.container
            .resolve(ListLatestEntriesUseCase)
            .execute(model, {});
        if (listResult.isFail()) {
            throw listResult.error;
        }

        expect(listResult.value).toEqual({
            entries: [],
            meta: {
                cursor: null,
                hasMoreItems: false,
                totalCount: 0
            }
        });
    });
});

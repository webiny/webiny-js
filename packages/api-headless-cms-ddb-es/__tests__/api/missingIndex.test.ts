import { useHandler } from "~tests/graphql/handler";
import { createMockPlugins } from "~tests/converters/mocks";
import { createGlobalModifierPlugin } from "~tests/api/mocks/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { configurations } from "~/configurations";

describe("missing index", () => {
    it("should return empty result set when index is missing", async () => {
        const { createContext, elasticsearch } = useHandler({
            plugins: [...createMockPlugins(), createGlobalModifierPlugin()]
        });
        const context = await createContext();

        const model = (await context.cms.getModel("converter")) as CmsModel;

        const config = configurations.es({
            model
        });

        const indexExistsResponse = await elasticsearch.indices.exists({
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

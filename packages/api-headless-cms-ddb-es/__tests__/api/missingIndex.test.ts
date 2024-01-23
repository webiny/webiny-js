import { useHandler } from "~tests/graphql/handler";
import { createMockPlugins } from "~tests/converters/mocks";
import { createGlobalModifierPlugin } from "~tests/api/mocks/plugins";
import { CmsModel } from "@webiny/api-headless-cms/types";

describe("missing index", () => {
    it("should return empty result set when index is missing", async () => {
        const { createContext } = useHandler({
            plugins: [...createMockPlugins(), createGlobalModifierPlugin()]
        });
        const context = await createContext();

        const model = (await context.cms.getModel("converter")) as CmsModel;

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

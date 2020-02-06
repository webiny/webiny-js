import prettier from "prettier";
import { setupContext } from "@webiny/api/testing";
import contentModels from "./data/contentModels";
import graphqlFieldPlugins from "../../src/plugins/graphqlFields";
import { createReadSDL } from "../../src/plugins/schemaPlugins/createReadSDL";
import categorySDL from "./snapshots/category";

export default ({ plugins }) => {
    describe("ContentModel to SDL", () => {
        let context;
        let fieldTypePlugins;

        beforeAll(async () => {
            context = await setupContext([plugins, graphqlFieldPlugins]);

            fieldTypePlugins = context.plugins
                .byType("cms-model-field-to-graphql")
                .reduce((acc, pl) => {
                    acc[pl.fieldType] = pl;
                    return acc;
                }, {});
        });

        test("createReadSDL", async () => {
            const categoryData = contentModels.find(c => c.modelId === "category");
            const sdl = createReadSDL({ model: categoryData, context, fieldTypePlugins });
            // Prettier
            const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
            const prettySnapshot = prettier.format(categorySDL.trim(), { parser: "graphql" });
            // Compare
            expect(prettyGql).toBe(prettySnapshot);
        });
    });
};

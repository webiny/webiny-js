import prettier from "prettier";
import { setupContext } from "@webiny/api/testing";
import contentModels from "./data/contentModels";
import graphqlFieldPlugins from "../../src/plugins/graphqlFields";
import { createReadSDL } from "../../src/plugins/schemaPlugins/createReadSDL";
import categoryReadSDL from "./snapshots/category.read";
import productReadSDL from "./snapshots/product.read";
import reviewReadSDL from "./snapshots/review.read";

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

        test("createReadSDL - Category", async () => {
            const model = contentModels.find(c => c.modelId === "category");
            const sdl = createReadSDL({ model, context, fieldTypePlugins });
            const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
            const prettySnapshot = prettier.format(categoryReadSDL.trim(), { parser: "graphql" });
            expect(prettyGql).toBe(prettySnapshot);
        });

        test("createReadSDL - Product", async () => {
            const model = contentModels.find(c => c.modelId === "product");
            const sdl = createReadSDL({ model, context, fieldTypePlugins });
            const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
            const prettySnapshot = prettier.format(productReadSDL.trim(), { parser: "graphql" });
            expect(prettyGql).toBe(prettySnapshot);
        });

        test("createReadSDL - Review", async () => {
            const model = contentModels.find(c => c.modelId === "review");
            const sdl = createReadSDL({ model, context, fieldTypePlugins });
            const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
            const prettySnapshot = prettier.format(reviewReadSDL.trim(), { parser: "graphql" });
            expect(prettyGql).toBe(prettySnapshot);
        });
    });
};

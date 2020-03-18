import prettier from "prettier";
import { setupContext } from "@webiny/api/testing";
import contentModels from "../data/contentModels";
import graphqlFieldPlugins from "../../../src/plugins/graphqlFields";
import { createManageSDL } from "../../../src/plugins/schema/createManageSDL";
import category from "./snapshots/category";
import product from "./snapshots/product";
import review from "./snapshots/review";

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

        test("Category SDL", async () => {
            const model = contentModels.find(c => c.modelId === "category");
            const sdl = createManageSDL({ model, context, fieldTypePlugins });
            const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
            const prettySnapshot = prettier.format(category.trim(), { parser: "graphql" });
            expect(prettyGql).toBe(prettySnapshot);
        });

        test("Product SDL", async () => {
            const model = contentModels.find(c => c.modelId === "product");
            const sdl = createManageSDL({ model, context, fieldTypePlugins });
            const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
            const prettySnapshot = prettier.format(product.trim(), { parser: "graphql" });
            expect(prettyGql).toBe(prettySnapshot);
        });

        test("Review SDL", async () => {
            const model = contentModels.find(c => c.modelId === "review");
            const sdl = createManageSDL({ model, context, fieldTypePlugins });
            const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
            const prettySnapshot = prettier.format(review.trim(), { parser: "graphql" });
            expect(prettyGql).toBe(prettySnapshot);
        });
    });
};

import prettier from "prettier";
import graphqlFieldPlugins from "../../src/handler/plugins/graphqlFields";
import { createReadSDL } from "../../src/handler/plugins/schema/createReadSDL";
import contentModels from "../mocks/contentModels";
import categorySDL from "./snapshots/category";
import productSDL from "./snapshots/product";
import reviewSDL from "./snapshots/review";
import { createUtils } from "../utils";

describe("READ - ContentModel to SDL", () => {
    let context;
    let fieldTypePlugins;
    const { useContext } = createUtils();

    beforeAll(async () => {
        context = await useContext(graphqlFieldPlugins);

        fieldTypePlugins = context.plugins
            .byType("cms-model-field-to-graphql")
            .reduce((acc, pl) => {
                acc[pl.fieldType] = pl;
                return acc;
            }, {});
    });

    test("Category SDL", async () => {
        const model = contentModels.find(c => c.modelId === "category");
        const sdl = createReadSDL({ model, context, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(categorySDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    test("Product SDL", async () => {
        const model = contentModels.find(c => c.modelId === "product");
        const sdl = createReadSDL({ model, context, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(productSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    test("Review SDL", async () => {
        const model = contentModels.find(c => c.modelId === "review");
        const sdl = createReadSDL({ model, context, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(reviewSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });
});

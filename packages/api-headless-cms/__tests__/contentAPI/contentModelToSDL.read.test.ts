import prettier from "prettier";
import graphqlFieldPlugins from "~/content/plugins/graphqlFields";
import { createReadSDL } from "~/content/plugins/schema/createReadSDL";
import contentModels from "./mocks/contentModels";
import categorySDL from "./snapshots/category.read";
import productSDL from "./snapshots/product.read";
import reviewSDL from "./snapshots/review.read";

describe("READ - ContentModel to SDL", () => {
    const fieldTypePlugins = graphqlFieldPlugins().reduce((acc, pl) => {
        acc[pl.fieldType] = pl;
        return acc;
    }, {});

    test("Category SDL", async () => {
        const model = contentModels.find(c => c.modelId === "category");
        const sdl = createReadSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(categorySDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    test("Product SDL", async () => {
        const model = contentModels.find(c => c.modelId === "product");
        const sdl = createReadSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(productSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    test("Review SDL", async () => {
        const model = contentModels.find(c => c.modelId === "review");
        const sdl = createReadSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(reviewSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });
});

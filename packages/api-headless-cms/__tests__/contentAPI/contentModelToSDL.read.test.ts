import prettier from "prettier";
import { createGraphQLFields } from "~/graphqlFields";
import { createReadSDL } from "~/graphql/schema/createReadSDL";
import contentModels from "./mocks/contentModels";
import categorySDL from "./snapshots/category.read";
import productSDL from "./snapshots/product.read";
import reviewSDL from "./snapshots/review.read";
import { CmsModelFieldToGraphQLPlugin } from "~/types";

describe("READ - ContentModel to SDL", () => {
    const fieldTypePlugins = createGraphQLFields().reduce<
        Record<string, CmsModelFieldToGraphQLPlugin>
    >((acc, pl) => {
        acc[pl.fieldType] = pl;
        return acc;
    }, {});

    test("Category SDL", async () => {
        const model = contentModels.find(c => c.modelId === "category");
        if (!model) {
            throw new Error("Could not find model `category`.");
        }
        const sdl = createReadSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(categorySDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    test("Product SDL", async () => {
        const model = contentModels.find(c => c.modelId === "product");
        if (!model) {
            throw new Error("Could not find model `category`.");
        }
        const sdl = createReadSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(productSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    test("Review SDL", async () => {
        const model = contentModels.find(c => c.modelId === "review");
        if (!model) {
            throw new Error("Could not find model `category`.");
        }
        const sdl = createReadSDL({ model, fieldTypePlugins });
        const prettyGql = prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = prettier.format(reviewSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });
});

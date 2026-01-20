import { describe, expect, it } from "vitest";
import prettier from "prettier";
import { createGraphQLFields } from "~/graphqlFields/index.js";
import { createReadSDL } from "~/graphql/schema/createReadSDL.js";
import contentModels from "./mocks/contentModels.js";
import categorySDL from "./snapshots/category.read.js";
import productSDL from "./snapshots/product.read.js";
import reviewSDL from "./snapshots/review.read.js";
import pageSDL from "./snapshots/page.read.js";
import fruitSDL from "./snapshots/fruit.read.js";
import type { CmsModel, CmsModelFieldToGraphQLPlugin } from "~/types/index.js";
import { pageModel } from "./mocks/pageWithDynamicZonesModel.js";

/**
 * Method createReadDSL expected model with filtered deleted fields.
 * This is internal call in our system, but for sake of tests, we call it directly.
 *
 * Because of that reason, we will pass the model with filtered fields into it - if we do not: schema generating test will be wrong.
 */

const getModel = (modelId: string): CmsModel => {
    const model = contentModels.find(c => c.modelId === modelId);
    if (!model) {
        throw new Error(`Could not find model "${modelId}".`);
    }
    return model;
};

describe("READ - ContentModel to SDL", () => {
    const fieldTypePlugins = createGraphQLFields().reduce<
        Record<string, CmsModelFieldToGraphQLPlugin>
    >((acc, pl) => {
        acc[pl.fieldType] = pl;
        return acc;
    }, {});

    const models = [...contentModels];
    
    it("Fruit SDL", async () => {
        const model = getModel("fruit");
        
        const sdl = createReadSDL({ models, model, fieldTypePlugins, sorterPlugins: [] });
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(fruitSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Category SDL", async () => {
        const model = getModel("category");

        const sdl = createReadSDL({ models, model, fieldTypePlugins, sorterPlugins: [] });
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(categorySDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Product SDL", async () => {
        const model = getModel("product");

        const sdl = createReadSDL({ models, model, fieldTypePlugins, sorterPlugins: [] });
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(productSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Review SDL", async () => {
        const model = getModel("review");

        const sdl = createReadSDL({ models, model, fieldTypePlugins, sorterPlugins: [] });
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(reviewSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Dynamic Zone SDL", async () => {
        const sdl = createReadSDL({
            models,
            model: pageModel as CmsModel,
            fieldTypePlugins,
            sorterPlugins: []
        });
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(pageSDL.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });
});

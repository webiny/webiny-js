import { describe, expect, it } from "vitest";
import { format } from "oxfmt";
import { createReadSDL } from "~/graphql/schema/createReadSDL.js";
import contentModels from "./mocks/contentModels.js";
import categorySDL from "./snapshots/category.read.js";
import productSDL from "./snapshots/product.read.js";
import reviewSDL from "./snapshots/review.read.js";
import pageSDL from "./snapshots/page.read.js";
import fruitSDL from "./snapshots/fruit.read.js";
import type { CmsModel } from "~/types/index.js";
import { pageModel } from "./mocks/pageWithDynamicZonesModel.js";
import { createFieldTypePluginsRegistry } from "~tests/__helpers/fields/fieldTypePlugins.js";

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
    const fieldRegistry = createFieldTypePluginsRegistry();

    const models = [...contentModels];

    it("Fruit SDL", async () => {
        const model = getModel("fruit");

        const sdl = createReadSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", fruitSDL.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Category SDL", async () => {
        const model = getModel("category");

        const sdl = createReadSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", categorySDL.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Product SDL", async () => {
        const model = getModel("product");

        const sdl = createReadSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", productSDL.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Review SDL", async () => {
        const model = getModel("review");

        const sdl = createReadSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", reviewSDL.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Dynamic Zone SDL", async () => {
        const sdl = createReadSDL({
            models,
            model: pageModel as CmsModel,
            fieldRegistry,
            sorters: []
        });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", pageSDL.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });
});

import { describe, expect, it } from "vitest";
import { format } from "oxfmt";
import contentModels from "./mocks/contentModels.js";
import categoryManage from "./snapshots/category.manage.js";
import productManage from "./snapshots/product.manage.js";
import reviewManage from "./snapshots/review.manage.js";
import type { CmsModel } from "~/types/index.js";
import { createManageSDL } from "~/graphql/schema/createManageSDL.js";
import { pageModel } from "./mocks/pageWithDynamicZonesModel.js";
import pageManage from "./snapshots/page.manage.js";
import { createFieldTypePluginsRegistry } from "~tests/__helpers/fields/fieldTypePlugins.js";

describe("MANAGE - ContentModel to SDL", () => {
    const fieldRegistry = createFieldTypePluginsRegistry();

    const models = [...contentModels];

    it("Category SDL", async () => {
        const model = contentModels.find(c => c.modelId === "category") as CmsModel;
        const sdl = createManageSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", categoryManage.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Product SDL", async () => {
        const model = contentModels.find(c => c.modelId === "product") as CmsModel;
        const sdl = createManageSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", productManage.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Review SDL", async () => {
        const model = contentModels.find(c => c.modelId === "review") as CmsModel;
        const sdl = createManageSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", reviewManage.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Dynamic Zone SDL", async () => {
        const sdl = createManageSDL({
            models,
            model: pageModel as CmsModel,
            fieldRegistry,
            sorters: []
        });
        const prettyGql = (await format("query.graphql", sdl.trim())).code;
        const prettySnapshot = (await format("query.graphql", pageManage.trim())).code;
        expect(prettyGql).toBe(prettySnapshot);
    });
});

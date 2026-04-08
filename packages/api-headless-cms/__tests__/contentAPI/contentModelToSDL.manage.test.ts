import { describe, expect, it } from "vitest";
import prettier from "prettier";
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
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(categoryManage.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Product SDL", async () => {
        const model = contentModels.find(c => c.modelId === "product") as CmsModel;
        const sdl = createManageSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(productManage.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Review SDL", async () => {
        const model = contentModels.find(c => c.modelId === "review") as CmsModel;
        const sdl = createManageSDL({ models, model, fieldRegistry, sorters: [] });
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(reviewManage.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });

    it("Dynamic Zone SDL", async () => {
        const sdl = createManageSDL({
            models,
            model: pageModel as CmsModel,
            fieldRegistry,
            sorters: []
        });
        const prettyGql = await prettier.format(sdl.trim(), { parser: "graphql" });
        const prettySnapshot = await prettier.format(pageManage.trim(), { parser: "graphql" });
        expect(prettyGql).toBe(prettySnapshot);
    });
});

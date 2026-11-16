import { describe, it, expect } from "vitest";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { CmsModel } from "~/types.js";
import { ContentModelsDataSource } from "./ContentModelsDataSource.js";

const model = (modelId: string, tags: string[] = []): CmsModel =>
    ({ id: modelId, modelId, name: modelId, tags }) as unknown as CmsModel;

describe("ContentModelsDataSource", () => {
    it("lists and counts only the models the screen shows, never hidden ones", async () => {
        const models = [model("product"), model("fmFile", ["$hidden:true"]), model("article")];
        const cache = new ListCache<CmsModel>();
        const dataSource = new ContentModelsDataSource(
            {
                execute: async () => {
                    cache.setItems(models);
                    return models;
                }
            },
            cache
        );

        await dataSource.query({});

        expect(dataSource.rows.map(row => row.modelId)).toEqual(["product", "article"]);
        expect(dataSource.meta.totalCount).toBe(2);
    });
});

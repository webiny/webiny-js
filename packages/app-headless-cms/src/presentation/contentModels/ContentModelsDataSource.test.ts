import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
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

    it("searches and sorts the listed models without loading again, still leaving hidden ones out", async () => {
        const models = [model("product"), model("fmFile", ["$hidden:true"]), model("article")];
        const cache = new ListCache<CmsModel>();
        const execute = vi.fn(async () => {
            cache.setItems(models);
            return models;
        });
        const dataSource = new ContentModelsDataSource({ execute }, cache);

        await dataSource.query({});
        await dataSource.query({ search: "file" });
        expect(dataSource.rows).toEqual([]);

        await dataSource.query({ search: "R", sort: { field: "name", direction: "ASC" } });
        expect(dataSource.rows.map(row => row.modelId)).toEqual(["article", "product"]);
        expect(dataSource.meta.totalCount).toBe(2);

        expect(execute).toHaveBeenCalledTimes(1);
    });
});

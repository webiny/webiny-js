import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { ModelGroupDataSource } from "./ModelGroupDataSource.js";

const group = (id: string, name: string, createdOn: string): ModelGroupDto =>
    ({ id, name, slug: id, createdOn }) as unknown as ModelGroupDto;

const GROUPS = [
    group("blog", "Blog", "2026-01-01T00:00:00.000Z"),
    group("shop", "Shop", "2026-03-01T00:00:00.000Z"),
    group("ungrouped", "Ungrouped", "2026-02-01T00:00:00.000Z")
];

describe("ModelGroupDataSource", () => {
    it("searches and sorts the loaded groups without loading again", async () => {
        const cache = new ListCache<ModelGroupDto>();
        const execute = vi.fn(async () => {
            cache.setItems(GROUPS);
            return GROUPS;
        });
        const dataSource = new ModelGroupDataSource({ execute }, cache);

        await dataSource.query({ sort: { field: "createdOn", direction: "DESC" } });
        expect(dataSource.rows.map(row => row.id)).toEqual(["shop", "ungrouped", "blog"]);

        await dataSource.query({ search: "o", sort: { field: "name", direction: "DESC" } });
        expect(dataSource.rows.map(row => row.id)).toEqual(["ungrouped", "shop", "blog"]);

        await dataSource.query({ search: "SHOP", sort: { field: "name", direction: "DESC" } });
        expect(dataSource.rows.map(row => row.id)).toEqual(["shop"]);
        expect(dataSource.meta.totalCount).toBe(1);

        expect(execute).toHaveBeenCalledTimes(1);
    });
});

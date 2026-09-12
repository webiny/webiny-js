import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";
import { AiSdkTool } from "@webiny/api-core/features/ai/index.js";
import { QueryEntriesTool } from "~/features/ai/QueryEntriesTool.js";
import { CmsWhereMapperFeature } from "~/features/whereMapper/feature.js";
import { CmsSortMapperFeature } from "~/features/sortMapper/feature.js";
import type { CmsEntryListParams, CmsModel } from "~/types/index.js";

const productModel = {
    modelId: "product",
    name: "Product",
    description: null,
    group: "ungrouped",
    singularApiName: "Product",
    pluralApiName: "Products",
    titleFieldId: "name",
    fields: [
        { fieldId: "name", type: "text", label: "Name", validation: [] },
        { fieldId: "price", type: "number", label: "Price", validation: [] },
        // Deliberately prefixed by "price" — proves longest-match routing, not startsWith chaos.
        { fieldId: "price_range", type: "text", label: "Price range", validation: [] },
        { fieldId: "onSale", type: "boolean", label: "On sale", validation: [] },
        /*
         * Underscored, and its first segment is NOT itself a field. `price_range` does not catch the
         * bug this guards: reading the segment before the first `_` yields `price`, which happens to
         * be a real field, so it routed correctly by accident. `on_sale` yields `on`, which is not.
         */
        { fieldId: "on_sale", type: "boolean", label: "On sale (legacy)", validation: [] }
    ]
} as unknown as CmsModel;

/**
 * Captures the params the tool hands to the CMS, which is the whole point: the entry-meta vs `values`
 * split is invisible from the tool's own return value but is exactly what a real CMS rejects.
 */
const resolveTool = () => {
    const captured: { params?: CmsEntryListParams } = {};
    const container = new Container();

    container.registerInstance(GetModelUseCase, {
        execute: async () => Result.ok(productModel)
    } as GetModelUseCase.Interface);

    container.registerInstance(ListLatestEntriesUseCase, {
        execute: async (_model: CmsModel, params?: CmsEntryListParams) => {
            captured.params = params;
            return Result.ok({
                entries: [],
                meta: { totalCount: 0, hasMoreItems: false, cursor: null }
            });
        }
    } as unknown as ListLatestEntriesUseCase.Interface);

    /*
     * The real mappers, not stubs. The routing these tests assert IS the mappers' behaviour now that
     * the tool delegates to them, so stubbing would leave both sides untested.
     */
    CmsWhereMapperFeature.register(container);
    CmsSortMapperFeature.register(container);

    container.register(QueryEntriesTool);

    return { tool: container.resolveAll(AiSdkTool)[0], captured };
};

const whereFor = async (where: Record<string, unknown>) => {
    const { tool, captured } = resolveTool();
    await tool.execute({ modelId: "product", where });
    return captured.params?.where as Record<string, any>;
};

describe("queryEntries where routing", () => {
    it("nests the model's own fields under `values`", async () => {
        expect(await whereFor({ onSale: true })).toEqual({ values: { onSale: true } });
    });

    it("nests operator suffixes on model fields", async () => {
        expect(await whereFor({ price_gt: 500, name_contains: "desk" })).toEqual({
            values: { price_gt: 500, name_contains: "desk" }
        });
    });

    it("keeps entry meta fields at the top level", async () => {
        expect(await whereFor({ status: "draft", savedOn_gt: "2026-01-01" })).toEqual({
            status: "draft",
            savedOn_gt: "2026-01-01"
        });
    });

    it("splits a mixed filter into both levels", async () => {
        expect(await whereFor({ onSale: true, price_gt: 500, status: "draft" })).toEqual({
            status: "draft",
            values: { onSale: true, price_gt: 500 }
        });
    });

    it("prefers the longest matching fieldId", async () => {
        // "price_range" must win over "price" + "_range", which is not a real operator.
        expect(await whereFor({ price_range: "high" })).toEqual({
            values: { price_range: "high" }
        });
    });

    it("nests a field whose id contains an underscore", async () => {
        expect(await whereFor({ on_sale: true })).toEqual({ values: { on_sale: true } });
    });

    it("nests an underscored field carrying an operator", async () => {
        expect(await whereFor({ on_sale_not: true })).toEqual({
            values: { on_sale_not: true }
        });
    });

    it("routes fields inside AND/OR, not just at the top level", async () => {
        /*
         * The nesting has to happen inside the branches too. Passing them through whole left
         * `onSale` unqualified, and the CMS rejects an unqualified model field with "there is no
         * field with the fieldId onSale" — the same failure the top-level routing exists to prevent.
         */
        expect(await whereFor({ AND: [{ onSale: true }], OR: [{ status: "draft" }] })).toEqual({
            AND: [{ values: { onSale: true } }],
            OR: [{ status: "draft" }]
        });
    });

    it("respects an explicitly nested `values` object", async () => {
        expect(await whereFor({ values: { onSale: true }, status: "draft" })).toEqual({
            status: "draft",
            values: { onSale: true }
        });
    });

    it("omits `values` entirely when no model field is filtered", async () => {
        expect(await whereFor({ status: "draft" })).not.toHaveProperty("values");
    });
});

describe("queryEntries sort mapping", () => {
    const sortFor = async (sort: string[]) => {
        const { tool, captured } = resolveTool();
        await tool.execute({ modelId: "product", sort });
        return captured.params?.sort;
    };

    it("prefixes model fields with `values_`", async () => {
        expect(await sortFor(["price_DESC"])).toEqual(["values_price_DESC"]);
    });

    it("leaves entry meta fields alone", async () => {
        expect(await sortFor(["savedOn_DESC"])).toEqual(["savedOn_DESC"]);
    });

    it("maps a mixed list per directive", async () => {
        expect(await sortFor(["onSale_ASC", "createdOn_DESC"])).toEqual([
            "values_onSale_ASC",
            "createdOn_DESC"
        ]);
    });

    it("prefixes an underscored field id", async () => {
        // The old pattern excluded `_` from the field name, so this matched nothing and was dropped.
        expect(await sortFor(["on_sale_DESC"])).toEqual(["values_on_sale_DESC"]);
    });

    it("rejects a directive it cannot read instead of dropping it", async () => {
        /*
         * The mapper discards what it cannot parse. Left alone that runs the query unsorted while the
         * model reports it as sorted, so the tool refuses and says what the format is.
         */
        const { tool } = resolveTool();

        await expect(tool.execute({ modelId: "product", sort: ["nonsense"] })).rejects.toThrow(
            /must be `<fieldId>_ASC` or `<fieldId>_DESC`/
        );
    });

    it("rejects a partly unreadable list rather than silently sorting by the rest", async () => {
        const { tool } = resolveTool();

        await expect(
            tool.execute({ modelId: "product", sort: ["price_DESC", "nonsense"] })
        ).rejects.toThrow(/nonsense/);
    });
});

describe("queryEntries limits", () => {
    it("defaults to 10 and caps at 50", async () => {
        const a = resolveTool();
        await a.tool.execute({ modelId: "product" });
        expect(a.captured.params?.limit).toBe(10);

        const b = resolveTool();
        await b.tool.execute({ modelId: "product", limit: 5000 });
        expect(b.captured.params?.limit).toBe(50);
    });
});

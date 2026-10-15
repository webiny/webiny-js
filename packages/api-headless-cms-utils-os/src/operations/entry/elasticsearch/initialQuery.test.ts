import { afterEach, describe, expect, it } from "vitest";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { createInitialQuery } from "./initialQuery.js";

const model = { modelId: "article", tenant: "acme" } as CmsModel;

const tenantFilter = { term: { "tenant.keyword": "acme" } };
const modelFilter = { term: { "modelId.keyword": "article" } };

/*
 * Whether entries are filtered by tenant must follow the model's index (CmsModelOpenSearchIndex),
 * not the OPENSEARCH_SHARED_INDEXES variable. A decorator can isolate or share an index per model,
 * so the two can disagree.
 */
describe("createInitialQuery", () => {
    const original = process.env.OPENSEARCH_SHARED_INDEXES;

    afterEach(() => {
        process.env.OPENSEARCH_SHARED_INDEXES = original;
    });

    it("filters by tenant and model when the index is shared, even if the variable says otherwise", () => {
        process.env.OPENSEARCH_SHARED_INDEXES = "false";

        const query = createInitialQuery({ model, where: { latest: true }, shared: true });

        expect(query.filter).toContainEqual(tenantFilter);
        expect(query.filter).toContainEqual(modelFilter);
    });

    it("doesn't filter by tenant when the index isn't shared, even if the variable says it is", () => {
        process.env.OPENSEARCH_SHARED_INDEXES = "true";

        const query = createInitialQuery({ model, where: { latest: true }, shared: false });

        expect(query.filter).not.toContainEqual(tenantFilter);
        expect(query.filter).not.toContainEqual(modelFilter);
    });
});

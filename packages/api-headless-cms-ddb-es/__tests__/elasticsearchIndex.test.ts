import { describe, expect, it } from "vitest";
import { getOpenSearchIndexPrefix, isSharedOpenSearchIndex } from "@webiny/api-opensearch";

const getEsIndex = (model: { tenant: string; modelId: string }) => {
    if (!model.tenant) {
        throw new Error(
            `Missing "tenant" parameter when trying to create Elasticsearch index name.`
        );
    }
    const shared = isSharedOpenSearchIndex();
    const index = [shared ? "root" : model.tenant, "headless-cms", model.modelId]
        .join("-")
        .toLowerCase();
    const prefix = getOpenSearchIndexPrefix();
    return { index: prefix ? prefix + index : index };
};

describe("Elasticsearch index", () => {
    const tenants = [["root"], ["admin"], ["unknown"]];

    it.each(tenants)("should create index with tenant id as part of the name", async tenant => {
        const prefix = getOpenSearchIndexPrefix();

        const { index } = getEsIndex({
            tenant,
            modelId: "testModel"
        });

        expect(index).toEqual(`${prefix}${tenant}-headless-cms-testModel`.toLowerCase());
    });

    it("should throw error when missing tenant but it is required", async () => {
        expect(() => {
            getEsIndex({
                /**
                 * We expect error because we are testing the case when tenant is missing.
                 */
                // @ts-expect-error
                tenant: null,
                modelId: "testModel"
            });
        }).toThrowError(
            `Missing "tenant" parameter when trying to create Elasticsearch index name.`
        );
    });

    it.each(tenants)(
        "should be root tenant in the index, no matter which one is sent",
        async tenant => {
            process.env.OPENSEARCH_SHARED_INDEXES = "true";

            const prefix = getOpenSearchIndexPrefix();

            const { index: noLocaleIndex } = getEsIndex({
                tenant,
                modelId: "testModel"
            });
            expect(noLocaleIndex).toEqual(`${prefix}root-headless-cms-testModel`.toLowerCase());
        }
    );
});

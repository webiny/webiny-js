import { describe, expect, it } from "vitest";
import { configurations } from "~/configurations";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

describe("Elasticsearch index", () => {
    const tenants = [["root"], ["admin"]];

    it.each(tenants)("should create index with tenant id as part of the name", async tenant => {
        const prefix = getOpenSearchIndexPrefix();

        const { index } = configurations.es({
            model: {
                tenant,
                modelId: "testModel"
            }
        });

        expect(index).toEqual(`${prefix}${tenant}-headless-cms-testModel`.toLowerCase());
    });

    it("should throw error when missing tenant but it is required", async () => {
        expect(() => {
            configurations.es({
                model: {
                    /**
                     * We expect error because we are testing the case when tenant is missing.
                     */
                    // @ts-expect-error
                    tenant: null,
                    modelId: "testModel"
                }
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

            const { index: noLocaleIndex } = configurations.es({
                model: {
                    tenant,
                    modelId: "testModel"
                }
            });
            expect(noLocaleIndex).toEqual(`${prefix}root-headless-cms-testModel`.toLowerCase());
        }
    );
});

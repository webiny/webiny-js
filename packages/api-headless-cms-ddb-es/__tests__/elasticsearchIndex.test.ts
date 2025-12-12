import { beforeEach, describe, expect, it } from "vitest";
import { configurations } from "~/configurations";
import { CmsModel } from "@webiny/api-headless-cms/types";
import { getElasticsearchIndexPrefix } from "@webiny/api-elasticsearch";

describe("Elasticsearch index", () => {
    const withLocaleItems = [["root"], ["admin"]];

    beforeEach(() => {
        process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = undefined;
    });

    it.each(withLocaleItems)(
        "should create index with tenant id as part of the name",
        async tenant => {
            process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

            const prefix = getElasticsearchIndexPrefix();

            const { index } = configurations.es({
                model: {
                    tenant,
                    modelId: "testModel"
                } as CmsModel
            });

            expect(index).toEqual(`${prefix}${tenant}-headless-cms-testModel`.toLowerCase());
        }
    );

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

    it.each(withLocaleItems)(
        "should be root tenant in the index, no matter which one is sent",
        async (tenant, locale) => {
            process.env.ELASTICSEARCH_SHARED_INDEXES = "true";

            const prefix = getElasticsearchIndexPrefix();

            const { index: noLocaleIndex } = configurations.es({
                model: {
                    tenant,
                    modelId: "testModel"
                } as CmsModel
            });
            expect(noLocaleIndex).toEqual(
                `${prefix}root-headless-cms-${locale}-testModel`.toLowerCase()
            );
        }
    );
});

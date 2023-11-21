import { configurations } from "~/configurations";
import { CmsModel } from "@webiny/api-headless-cms/types";

describe("Elasticsearch index", () => {
    const withLocaleItems = [
        ["root", "en-US"],
        ["admin", "en-EN"],
        ["root", "de-DE"],
        ["admin", "en-GB"],
        ["root,", "de"]
    ];

    beforeEach(() => {
        process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = undefined;
    });

    it.each(withLocaleItems)(
        "should create index with locale code as part of the name",
        async (tenant, locale) => {
            process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

            const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

            const { index } = configurations.es({
                model: {
                    tenant,
                    locale,
                    modelId: "testModel"
                } as CmsModel
            });

            expect(index).toEqual(
                `${prefix}${tenant}-headless-cms-${locale}-testModel`.toLowerCase()
            );
        }
    );

    it("should throw error when missing tenant but it is required", async () => {
        expect(() => {
            configurations.es({
                model: {
                    tenant: null as any,
                    locale: "en-US",
                    modelId: "testModel"
                } as CmsModel
            });
        }).toThrowError(
            `Missing "tenant" parameter when trying to create Elasticsearch index name.`
        );
    });

    it("should throw error when missing locale but it is required", async () => {
        expect(() => {
            configurations.es({
                model: {
                    tenant: "root",
                    locale: null as any,
                    modelId: "testModel"
                } as CmsModel
            });
        }).toThrowError(
            `Missing "locale" parameter when trying to create Elasticsearch index name.`
        );
    });

    it.each(withLocaleItems)(
        "should be root tenant in the index, no matter which one is sent",
        async (tenant, locale) => {
            process.env.ELASTICSEARCH_SHARED_INDEXES = "true";

            const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

            const { index: noLocaleIndex } = configurations.es({
                model: {
                    tenant,
                    locale,
                    modelId: "testModel"
                } as CmsModel
            });
            expect(noLocaleIndex).toEqual(
                `${prefix}root-headless-cms-${locale}-testModel`.toLowerCase()
            );
        }
    );
});

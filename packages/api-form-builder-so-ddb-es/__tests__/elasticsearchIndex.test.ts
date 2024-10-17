import { configurations } from "~/configurations";
import { getElasticsearchIndexPrefix } from "@webiny/api-elasticsearch";

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

            const prefix = getElasticsearchIndexPrefix();

            const { index } = configurations.es({
                tenant,
                locale
            });

            expect(index).toEqual(`${prefix}${tenant}-${locale}-form-builder`.toLowerCase());
        }
    );

    it.each(withLocaleItems)(
        "should create index without locale code as part of the name",
        async (tenant, locale) => {
            const prefix = getElasticsearchIndexPrefix();

            const { index } = configurations.es({
                tenant,
                locale
            });

            expect(index).toEqual(`${prefix}${tenant}-form-builder`.toLowerCase());
        }
    );

    it("should throw error when missing tenant but it is required", async () => {
        expect(() => {
            configurations.es({
                /**
                 * Should be error because this is not a valid tenant.
                 * We want to test the error throwing, so we are sending null anyway.
                 */
                // @ts-expect-error
                tenant: null,
                locale: "en-US"
            });
        }).toThrowError(
            `Missing "tenant" parameter when trying to create Elasticsearch index name.`
        );
    });

    it("should throw error when missing locale but it is required", async () => {
        process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

        expect(() => {
            configurations.es({
                tenant: "root",
                /**
                 * Should be error because this is not a valid locale.
                 * We want to test the error throwing, so we are sending null anyway.
                 */
                // @ts-expect-error
                locale: null
            });
        }).toThrowError(
            `Missing "locale" parameter when trying to create Elasticsearch index name.`
        );
    });

    it.each(withLocaleItems)(
        "should be root tenant in the index, no matter which one is sent",
        async (tenant, locale) => {
            process.env.ELASTICSEARCH_SHARED_INDEXES = "true";

            const prefix = getElasticsearchIndexPrefix();

            const { index: noLocaleIndex } = configurations.es({
                tenant,
                locale
            });
            expect(noLocaleIndex).toEqual(`${prefix}root-form-builder`);
        }
    );

    it.each(withLocaleItems)(
        "should be root tenant in the index, no matter which one is sent",
        async (tenant, locale) => {
            process.env.ELASTICSEARCH_SHARED_INDEXES = "true";
            process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

            const prefix = getElasticsearchIndexPrefix();

            const { index: noLocaleIndex } = configurations.es({
                tenant,
                locale
            });
            expect(noLocaleIndex).toEqual(`${prefix}root-${locale}-form-builder`.toLowerCase());
        }
    );
});

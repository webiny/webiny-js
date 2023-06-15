import { configurations } from "~/configurations";
import { getDefaultPrefix } from "~tests/defaultPrefix";

describe("Elasticsearch index", () => {
    const withLocaleItems = [
        ["root", "en-US"],
        ["admin", "en-EN"],
        ["root", "de-DE"],
        ["admin", "en-GB"],
        ["root,", "de"]
    ];

    beforeEach(async () => {
        process.env.ELASTICSEARCH_SHARED_INDEXES = undefined;
        process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = undefined;
        process.env.ELASTIC_SEARCH_INDEX_PREFIX = getDefaultPrefix();
    });

    it.each(withLocaleItems)(
        "should create index with locale code as part of the name",
        async (tenant, locale) => {
            process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

            const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

            const { index } = configurations.es({
                tenant,
                locale
            });

            expect(index).toEqual(`${prefix}${tenant}-${locale}-file-manager`.toLowerCase());
        }
    );

    it.each(withLocaleItems)(
        "should create index without locale code as part of the name",
        async (tenant, locale) => {
            const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

            const { index } = configurations.es({
                tenant,
                locale
            });

            expect(index).toEqual(`${prefix}${tenant}-file-manager`.toLowerCase());
        }
    );

    it("should throw error when missing tenant but it is required", async () => {
        expect(() => {
            configurations.es({
                tenant: null as any,
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
                locale: null as any
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
                tenant,
                locale
            });
            expect(noLocaleIndex).toEqual(`${prefix}root-file-manager`);
        }
    );

    it.each(withLocaleItems)(
        "should be root tenant in the index, no matter which one is sent",
        async (tenant, locale) => {
            process.env.ELASTICSEARCH_SHARED_INDEXES = "true";
            process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

            const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

            const { index: noLocaleIndex } = configurations.es({
                tenant,
                locale
            });
            expect(noLocaleIndex).toEqual(`${prefix}root-${locale}-file-manager`.toLowerCase());
        }
    );
});

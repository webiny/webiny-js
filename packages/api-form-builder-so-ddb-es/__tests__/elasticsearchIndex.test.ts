import { configurations } from "~/configurations";

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

            const { index } = configurations.es({
                tenant,
                locale
            });

            expect(index).toEqual(`${tenant}-${locale}-form-builder`.toLowerCase());
        }
    );

    it.each(withLocaleItems)(
        "should create index without locale code as part of the name",
        async (tenant, locale) => {
            const { index } = configurations.es({
                tenant,
                locale
            });

            expect(index).toEqual(`${tenant}-form-builder`.toLowerCase());
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

            const { index: noLocaleIndex } = configurations.es({
                tenant,
                locale
            });
            expect(noLocaleIndex).toEqual("root-form-builder");
        }
    );

    it.each(withLocaleItems)(
        "should be root tenant in the index, no matter which one is sent",
        async (tenant, locale) => {
            process.env.ELASTICSEARCH_SHARED_INDEXES = "true";
            process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE = "true";

            const { index: noLocaleIndex } = configurations.es({
                tenant,
                locale
            });
            expect(noLocaleIndex).toEqual(`root-${locale}-form-builder`.toLowerCase());
        }
    );
});

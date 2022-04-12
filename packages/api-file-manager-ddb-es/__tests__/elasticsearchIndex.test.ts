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

            expect(index).toEqual(`${tenant}-${locale}-file-manager`.toLowerCase());
        }
    );

    it.each(withLocaleItems)(
        "should create index without locale code as part of the name",
        async (tenant, locale) => {
            const { index } = configurations.es({
                tenant,
                locale
            });

            expect(index).toEqual(`${tenant}-file-manager`.toLowerCase());
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
});

import WebinyError from "@webiny/error";

export interface ElasticsearchConfigParams {
    tenant: string;
    locale: string;
}

interface ElasticsearchConfig {
    index: string;
}

export const configurations = {
    es(params: ElasticsearchConfigParams): ElasticsearchConfig {
        const { tenant, locale } = params;
        if (!tenant) {
            throw new WebinyError(
                `Missing "tenant" parameter when trying to create Elasticsearch index name.`,
                "TENANT_ERROR"
            );
        }

        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";

        const tenantId = sharedIndex ? "root" : tenant;
        let localeCode: string | null = null;
        if (process.env.WEBINY_ELASTICSEARCH_INDEX_LOCALE === "true") {
            if (!locale) {
                throw new WebinyError(
                    `Missing "locale" parameter when trying to create Elasticsearch index name.`,
                    "LOCALE_ERROR"
                );
            }
            localeCode = locale;
        }

        const index = [tenantId, localeCode, "form-builder"]
            .filter(Boolean)
            .join("-")
            .toLowerCase();

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";
        if (!prefix) {
            return {
                index
            };
        }
        return {
            index: prefix + index
        };
    }
};

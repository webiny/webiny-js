import { CmsModel } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

interface ElasticsearchConfig {
    index: string;
}

interface CmsElasticsearchParams {
    model: CmsModel;
}
interface Configurations {
    es: (params: CmsElasticsearchParams) => ElasticsearchConfig;
}

export const configurations: Configurations = {
    es({ model }) {
        const { tenant, locale } = model;

        if (!tenant) {
            throw new WebinyError(
                `Missing "tenant" parameter when trying to create Elasticsearch index name.`,
                "TENANT_ERROR"
            );
        } else if (!locale) {
            throw new WebinyError(
                `Missing "locale" parameter when trying to create Elasticsearch index name.`,
                "LOCALE_ERROR"
            );
        }

        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const index = [sharedIndex ? "root" : tenant, "headless-cms", locale, model.modelId]
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

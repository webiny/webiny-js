import { CmsContentModel } from "@webiny/api-headless-cms/types";

interface ElasticsearchConfig {
    index: string;
}

interface CmsElasticsearchParams {
    model: CmsContentModel;
}
interface Configurations {
    es: (params: CmsElasticsearchParams) => ElasticsearchConfig;
}

const configurations: Configurations = {
    es({ model }) {
        const { tenant, locale } = model;
        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const index = [sharedIndex ? "root" : tenant, "headless-cms", locale, model.modelId]
            .join("-")
            .toLowerCase();

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};

export default configurations;

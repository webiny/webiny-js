import WebinyError from "@webiny/error";

export interface ElasticsearchParams {
    tenant: string;
}

export default {
    es: (params: ElasticsearchParams) => {
        const { tenant } = params;
        if (!tenant) {
            throw new WebinyError(
                `Missing "tenant" parameter when trying to create Elasticsearch index name.`,
                "TENANT_ERROR"
            );
        }

        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const index = `${sharedIndex ? "root" : tenant}-page-builder`;

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};

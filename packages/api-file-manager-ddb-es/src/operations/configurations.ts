export interface ElasticsearchConfigurationParams {
    tenant: string;
}
export const configurations = {
    es(params: ElasticsearchConfigurationParams) {
        const { tenant } = params;
        const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
        const index = `${sharedIndex ? "root" : tenant}-file-manager`;

        const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;
        if (prefix) {
            return { index: prefix + index };
        }
        return { index };
    }
};

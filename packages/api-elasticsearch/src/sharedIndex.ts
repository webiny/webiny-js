export const isSharedElasticsearchIndex = () => {
    return process.env.OPENSEARCH_SHARED_INDEXES === "true";
};

export const isSharedElasticsearchIndex = () => {
    return process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
};

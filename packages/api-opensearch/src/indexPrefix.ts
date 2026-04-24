export const getOpenSearchIndexPrefix = (): string => {
    return (
        process.env.OPENSEARCH_INDEX_PREFIX ||
        process.env.ELASTICSEARCH_INDEX_PREFIX ||
        process.env.WEBINY_OPENSEARCH_INDEX_PREFIX ||
        process.env.WEBINY_ELASTICSEARCH_INDEX_PREFIX ||
        ""
    );
};

export const getElasticsearchIndexPrefix = (): string => {
    return (
        process.env.ELASTIC_SEARCH_INDEX_PREFIX ||
        process.env.WBY_ELASTIC_SEARCH_INDEX_PREFIX ||
        ""
    );
};

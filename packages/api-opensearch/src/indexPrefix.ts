export const getOpenSearchIndexPrefix = (): string => {
    return process.env.OPENSEARCH_INDEX_PREFIX || process.env.WEBINY_OPENSEARCH_INDEX_PREFIX || "";
};

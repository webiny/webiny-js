export const isSharedOpenSearchIndex = () => {
    return process.env.OPENSEARCH_SHARED_INDEXES === "true";
};

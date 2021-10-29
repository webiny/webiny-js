module.exports.elasticIndexManager = (global, elasticsearchClient) => {
    const prefixes = [];

    const clearEsIndices = async () => {
        if (!prefixes.length) {
            return;
        }

        return elasticsearchClient.indices.delete({
            index: prefixes.map(p => `${p}-*`).join(",")
        });
    };

    global.__beforeEach = () => {
        const prefix = `${Date.now()}-`;
        prefixes.push(prefix);
        process.env.ELASTIC_SEARCH_INDEX_PREFIX = prefix;
    };

    global.__beforeAll = clearEsIndices;
    global.__afterAll = clearEsIndices;
};

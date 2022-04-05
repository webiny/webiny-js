module.exports.elasticIndexManager = (global, elasticsearchClient) => {
    const clearEsIndices = async () => {
        await elasticsearchClient.indices.delete({
            index: "_all"
        });
    };

    const clearEsIndexTemplates = async () => {
        await elasticsearchClient.indices.deleteIndexTemplate({
            name: "*"
        });
    };

    global.__beforeEach = async () => {
        await clearEsIndices();
    };

    global.__afterEach = async () => {
        await clearEsIndices();
    };

    global.__beforeAll = async () => {
        await clearEsIndices();
    };

    global.__afterAll = async () => {
        await clearEsIndices();
        await clearEsIndexTemplates();
    };
};

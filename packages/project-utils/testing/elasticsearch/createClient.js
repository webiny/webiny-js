const { createElasticsearchClient } = require("../../../api-elasticsearch/dist/client");

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || 9200;

const esEndpoint = process.env.ELASTIC_SEARCH_ENDPOINT;

const defaultOptions = {
    node: `http://localhost:${ELASTICSEARCH_PORT}`,
    auth: {},
    maxRetries: 10,
    pingTimeout: 500
};
if (!!esEndpoint) {
    defaultOptions.node = esEndpoint.match(/^http/) === null ? `https://${esEndpoint}` : esEndpoint;
    defaultOptions.auth = undefined;
}

const attachCustomEvents = client => {
    const createdIndexes = new Set();
    const originalCreate = client.indices.create;

    // @ts-ignore
    client.indices.create = async (params, options = {}) => {
        if (createdIndexes.has(params.index) === true) {
            throw new Error(
                `Index "${params.index}" already exists. It should be deleted after each of the tests.`
            );
        }
        createdIndexes.add(params.index);
        // @ts-ignore
        const response = await originalCreate.apply(client.indices, [params, options]);

        await client.indices.refresh({
            index: params.index
        });

        return response;
    };

    client.indices.deleteAll = async () => {
        const indexes = Array.from(createdIndexes.values());
        if (indexes.length === 0) {
            // console.log("No indexes to delete.");
            return;
        }
        const deletedIndexes = [];
        for (const index of indexes) {
            try {
                await client.indices.delete({
                    index,
                    ignore_unavailable: true
                });
                createdIndexes.delete(index);
                deletedIndexes.push(index);
            } catch (ex) {
                console.log(`Could not delete index "${index}".`);
                console.log(JSON.stringify(ex));
            }
        }
        createdIndexes.clear();
        //console.log(`Deleted indexes: ${deletedIndexes}`);
        //console.log(deletedIndexes.join(", "));
    };

    return client;
};

module.exports = {
    createElasticsearchClient: (options = {}) => {
        const client = createElasticsearchClient({
            ...defaultOptions,
            ...options
        });
        return attachCustomEvents(client);
    }
};

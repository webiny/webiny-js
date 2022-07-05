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

const wait = ms => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

const SNAPSHOT_ERROR = "snapshot_in_progress_exception";

const isSnapshotError = ex => {
    const rootCauseType = ex.meta?.body?.error?.type;
    if (rootCauseType === SNAPSHOT_ERROR) {
        return true;
    }
    const rootCauses = ex.meta?.body?.error?.root_cause;
    if (Array.isArray(rootCauses) === false) {
        return false;
    }
    for (const rc of rootCauses) {
        if (rc.type === SNAPSHOT_ERROR) {
            return true;
        }
    }
    return false;
};

const createDeleteIndexCallable = client => {
    /**
     * The amount of retries in case of snapshot error.
     */
    const max = 10;
    return async index => {
        for (let counter = 0; counter <= max; counter++) {
            /**
             * First we try to determine if the index actually exists.
             */
            try {
                const { body: exists } = await client.indices.exists({
                    index,
                    ignore_unavailable: false
                });
                if (!exists) {
                    return;
                }
            } catch (ex) {
                console.log(`Could not determine that index exists: ${index}`);
                console.log(ex.message);
                return;
            }
            /**
             * Then we delete it, or at least try.
             */
            try {
                await client.indices.delete({
                    index,
                    ignore_unavailable: true
                });
                return;
            } catch (ex) {
                console.log(`Could not delete index: ${index}`);
                console.log(JSON.stringify(ex));
                /**
                 * In case of snapshot error - we will retry.
                 */
                if (isSnapshotError(ex) === false) {
                    return;
                }
            }
            console.log("Is snapshot error, will try to delete the index in a sec...");
            /**
             * Let's retry deleting index again...
             */
            await wait(1000);
            counter++;
        }
    };
};

const attachCustomEvents = client => {
    const createdIndexes = new Set();
    const originalCreate = client.indices.create;

    const deleteIndexCallable = createDeleteIndexCallable(client);

    // @ts-ignore
    client.indices.create = async (params, options = {}) => {
        /**
         * First we always delete existing index, if any.
         */
        await deleteIndexCallable(params.index);

        // @ts-ignore
        const response = await originalCreate.apply(client.indices, [params, options]);

        if (createdIndexes.has(params.index) === false) {
            createdIndexes.add(params.index);
        }

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
                await deleteIndexCallable(index);
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

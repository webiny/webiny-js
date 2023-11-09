const { logger } = require("@webiny/project-utils/testing/logger");
const { createElasticsearchClient } = require("@webiny/api-elasticsearch");

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
                    ignore_unavailable: true
                });
                if (!exists) {
                    return;
                }
            } catch (ex) {
                logger.warn(`Could not determine that index "${index}" exists: ${ex.message}`);
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
                logger.warn(`Could not delete index "${index}": ${ex.message}`);
                /**
                 * In case of snapshot error - we will retry.
                 */
                if (isSnapshotError(ex) === false) {
                    return;
                }
                logger.debug("It's a snapshot error; will try to delete the index in a sec...");
            }
            /**
             * Let's retry deleting index again...
             */
            await wait(1000);
            counter++;
        }
    };
};

const attachCustomEvents = client => {
    logger.debug(`Attach custom events to ES`);
    const registeredIndexes = new Set();
    const originalCreate = client.indices.create;
    const originalExists = client.indices.exists;

    const registerIndex = input => {
        if (!input) {
            return;
        }
        const names = Array.isArray(input) ? input : [input];
        for (const name of names) {
            registeredIndexes.add(name);
        }
    };

    const deleteIndexCallable = createDeleteIndexCallable(client);

    client.indices.exists = async (params, options = {}) => {
        registerIndex(params.index);
        return originalExists.apply(client.indices, [params, options]);
    };

    client.indices.create = async (params, options = {}) => {
        /**
         * First we always delete existing index, if any.
         */
        await deleteIndexCallable(params.index);

        let response;
        try {
            response = await originalCreate.apply(client.indices, [params, options]);
        } catch (ex) {
            logger.error(`Failed to create index "${params.index}": ${ex.message}`);
            throw ex;
        }

        registeredIndexes.add(params.index);

        await client.indices.refresh({
            index: params.index
        });

        return response;
    };

    client.indices.deleteAll = async () => {
        logger.debug(`Running "client.indices.deleteAll".`);
        const indexes = Array.from(registeredIndexes.values());
        if (indexes.length === 0) {
            return;
        }
        logger.debug(indexes, "Delete all indexes.");
        for (const index of indexes) {
            try {
                await deleteIndexCallable(index);
            } catch (ex) {
                logger.warn(`Could not delete index "${index}".`);
            }
        }
        logger.debug(`Finished "client.indices.deleteAll".\n`);
    };

    client.indices.refreshAll = async () => {
        logger.debug(`Running "client.indices.refreshAll".`);
        const indexes = Array.from(registeredIndexes.values());
        if (indexes.length === 0) {
            return;
        }
        logger.debug(indexes, "Refreshing all indexes.");
        for (const index of indexes) {
            try {
                await client.indices.refresh({
                    index,
                    ignore_unavailable: true
                });
            } catch (ex) {
                logger.error(`Could not refresh index "${index}": ${ex.message}`);
                throw ex;
            }
        }
        logger.debug(`Finished "client.indices.refreshAll".\n`);
    };

    client.indices.registerIndex = registerIndex;

    return client;
};

module.exports = {
    createElasticsearchClient: async (options = {}) => {
        const config = {
            ...defaultOptions,
            ...options
        };
        const client = await createElasticsearchClient(config);
        return attachCustomEvents(client);
    }
};

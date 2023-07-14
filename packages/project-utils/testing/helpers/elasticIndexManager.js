const { logger } = require("../logger");

module.exports.elasticIndexManager = ({ global, client, onBeforeEach }) => {
    const clearEsIndices = async () => {
        logger.debug(`Started clearing Elasticsearch indices.`);
        try {
            await client.indices.deleteAll();
        } catch (ex) {
            logger.warn(`Could not delete all indexes: ${ex.message}.`);
            // throw ex;
        }
    };

    global.__beforeEach = async () => {
        logger.debug(`Start ES "beforeEach".`);
        await clearEsIndices();
        if (typeof onBeforeEach === "function") {
            await onBeforeEach();
        }
        logger.debug(`Finish ES "beforeEach".`);
    };

    global.__afterEach = async () => {
        logger.debug(`Start ES "afterEach".`);
        await clearEsIndices();
        logger.debug(`Finish ES "afterEach".`);
    };

    global.__beforeAll = async () => {
        logger.debug(`Start ES "beforeAll".`);
        await clearEsIndices();
        logger.debug(`Finish ES "beforeAll".`);
    };

    global.__afterAll = async () => {
        logger.debug(`Start ES "afterAll".`);
        await clearEsIndices();
        logger.debug(`Finish ES "afterAll".`);
    };
};

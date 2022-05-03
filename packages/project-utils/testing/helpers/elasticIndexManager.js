let prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;

module.exports.elasticIndexManager = ({ global, client, onBeforeEach }) => {
    /**
     * Prefix MUST exist. we cannot allow going further without the prefix.
     */
    if (!prefix) {
        throw new Error("process.env.ELASTIC_SEARCH_INDEX_PREFIX is not set!");
    }
    /**
     *
     * The regex to match all the indexes used by this tests.
     */
    //const re = new RegExp(`^${prefix}`);
    const clearEsIndices = async () => {
        //console.log("Started with clearing Elasticsearch indices.");
        try {
            await client.indices.deleteAll();
        } catch (ex) {
            console.log("Could not delete all indexes.");
            console.log(JSON.stringify(ex));
            throw ex;
        }
    };

    global.__beforeEach = async () => {
        await clearEsIndices();
        if (typeof onBeforeEach === "function") {
            await onBeforeEach();
        }
    };

    global.__afterEach = async () => {
        await clearEsIndices();
    };

    global.__beforeAll = async () => {
        await clearEsIndices();
    };

    global.__afterAll = async () => {
        await clearEsIndices();
    };
};

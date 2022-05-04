module.exports.elasticIndexManager = ({ global, client, onBeforeEach }) => {
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

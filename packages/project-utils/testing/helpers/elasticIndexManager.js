let prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;

module.exports.elasticIndexManager = ({ global, client }) => {
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
        try {
            await client.indices.deleteAll();
        } catch (ex) {
            console.log("Could not delete all indexes.");
            console.log(JSON.stringify(ex));
            throw ex;
        }
        //const response = await client.cat.indices({
        //    format: "json"
        //});
        //if (!response.body) {
        //    return;
        //}
        //const items = Object.values(response.body)
        //    .map(item => {
        //        return item.index;
        //    })
        //    .filter(index => {
        //        return index.match(re) !== null;
        //    });
        //if (items.length === 0) {
        //    return;
        //}
        //
        //try {
        //    await client.indices.delete({
        //        index: items
        //    });
        //} catch (ex) {
        //    console.log(ex.message);
        //    //throw ex;
        //}
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
    };
};

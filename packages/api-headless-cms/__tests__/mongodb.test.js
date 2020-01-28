import mongoDb from "@webiny/api-plugin-commodo-mongodb";
import mongoDbResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import runTests from "./tests/runTests";

const callbacks = {
    afterAll: []
};

const testCallbacks = {
    afterAll(cb) {
        callbacks.afterAll.push(cb);
    }
};

describe("MongoDB driver", async () => {
    runTests({
        plugins: mongoDb({
            database: {
                server: global.__MONGO_URI__,
                name: global.__MONGO_DB_NAME__
            },
            test: testCallbacks
        })
    });

    afterAll(async () => await Promise.all(callbacks.afterAll.map(cb => cb())));
});

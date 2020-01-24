import mongoDb from "@webiny/api-plugin-commodo-mongodb";
import mongoDbResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import runTests from "./graphql";

const callbacks = {
    afterAll: []
};

const testCallbacks = {
    afterAll(cb) {
        callbacks.afterAll.push(cb);
    }
};

describe("MongoDB Files API", () => {
    afterAll(async () => await Promise.all(callbacks.afterAll.map(cb => cb())));

    runTests({
        plugins: [
            mongoDb({
                database: {
                    server: global.__MONGO_URI__,
                    name: global.__MONGO_DB_NAME__
                },
                test: testCallbacks
            }),
            mongoDbResolvers()
        ]
    });
});

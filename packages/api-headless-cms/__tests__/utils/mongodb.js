import mongoDb from "@webiny/api-plugin-commodo-mongodb";

const callbacks = {
    afterAll: []
};

const testCallbacks = {
    afterAll(cb) {
        callbacks.afterAll.push(cb);
    }
};

export default (id, plugins, createUtils) => {
    afterAll(async () => await Promise.all(callbacks.afterAll.map(cb => cb())));

    return createUtils([
        {
            type: "context",
            name: "mongo-is-id",
            apply(context) {
                if (!context.commodo) {
                    context.commodo = {};
                }

                context.commodo.isId = value => {
                    if (typeof value === "string") {
                        return value.match(new RegExp("^[0-9a-fA-F]{24}$")) !== null;
                    }

                    return false;
                };
            }
        },
        mongoDb({
            database: {
                server: global.__MONGO_URI__,
                name: global.__MONGO_DB_NAME__ + "_" + id
            },
            test: testCallbacks
        }),
        ...plugins
    ]);
};

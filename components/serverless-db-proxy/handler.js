const { MongoClient } = require("mongodb");
const { EJSON } = require("bson");
const MONGODB_SERVER = process.env.MONGODB_SERVER;
const MONGODB_NAME = process.env.MONGODB_NAME;

let database = null;
let client = null;

async function getDatabase() {
    const client = await MongoClient.connect(MONGODB_SERVER, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return { database: client.db(MONGODB_NAME), client };
}

const executeOperation = async (collection, operation, args) => {
    switch (operation) {
        case "find": {
            const [findFilters, findOtherParams] = args;
            const results = database.collection(collection).find(findFilters);
            if (findOtherParams.limit) {
                results.limit(findOtherParams.limit);
            }
            if (findOtherParams.offset) {
                results.skip(findOtherParams.offset);
            }
            if (findOtherParams.sort) {
                results.sort(findOtherParams.sort);
            }

            return results.toArray();
        }
        case "count": {
            return database.collection(collection).countDocuments(...args);
        }

        case "insertOne": {
            return database.collection(collection).countDocuments(...args);
        }
    }
};

module.exports.handler = async event => {
    if (!client) {
        const refs = await getDatabase();
        client = refs.client;
        database = refs.database;
    }

    const { collection, operation } = event;
    if (!collection) {
        throw new Error("Collection on which the operation needs to be executed wasn't set.");
    }

    const [operationName, ...operationArgs] = operation;
    if (typeof operationName !== "string") {
        throw new Error("Operation name wasn't received.");
    }

    const result = await executeOperation(collection, operationName, operationArgs);
    return EJSON.stringify({ result });
};

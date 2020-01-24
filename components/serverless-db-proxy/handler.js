const { MongoClient } = require("mongodb");
const { EJSON } = require("bson");
const MONGODB_SERVER = process.env.MONGODB_SERVER;
const MONGODB_NAME = process.env.MONGODB_NAME;

let database = null;
let client = null;

async function getDatabase() {
    const client = await MongoClient.connect(MONGODB_SERVER, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000
    });

    return { database: client.db(MONGODB_NAME), client };
}

const executeOperation = async (collection, operation, args) => {
    const collectionInstance = database.collection(collection);

    if (operation === "find") {
        const [findFilters, findRestArgs] = args;
        const results = collectionInstance.find(findFilters);
        if (findRestArgs.limit) {
            results.limit(findRestArgs.limit);
        }
        if (findRestArgs.offset) {
            results.skip(findRestArgs.offset);
        }
        if (findRestArgs.sort) {
            results.sort(findRestArgs.sort);
        }

        return results.toArray();
    }

    if (operation === "aggregate") {
        return collectionInstance.aggregate(...args).toArray();
    }

    return collectionInstance[operation](...args);
};

module.exports.handler = async event => {
    try {
        let { body } = event;
        body = EJSON.parse(body);

        if (!client) {
            const refs = await getDatabase();
            client = refs.client;
            database = refs.database;
        }

        const { collection, operation } = body;
        if (!collection) {
            throw new Error("Collection on which the operation needs to be executed wasn't set.");
        }

        const [operationName, ...operationArgs] = operation;
        if (typeof operationName !== "string") {
            throw new Error("Operation name wasn't received.");
        }

        const result = await executeOperation(collection, operationName, operationArgs);
        return { response: EJSON.stringify({ result }) };
    } catch (e) {
        const report = {
            error: {
                name: e.constructor.name,
                message: e.message
            }
        };

        console.log("ERROR", report);

        return report;
    }
};

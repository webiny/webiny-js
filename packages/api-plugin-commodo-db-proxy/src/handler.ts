import { Db, MongoClient } from "mongodb";
import { EJSON } from "bson";
import { HandlerPlugin } from "@webiny/handler/types";

interface DatabaseProxyOptions {
    logCollection: string;
    server?: string;
    name?: string;
    database?: Db;
}

export default ({ logCollection, database, server, name }: DatabaseProxyOptions): HandlerPlugin => {
    let db: Db = database || null;

    async function getDatabase() {
        if (db) {
            return db;
        }

        const client = await MongoClient.connect(server, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 10000,
            serverSelectionTimeoutMS: 10000
        });

        return client.db(name);
    }

    const executeOperation = async (collection, operation, args) => {
        const collectionInstance = db.collection(collection);

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

    return {
        name: "handler-database-proxy",
        type: "handler",
        async handle({ args }) {
            const [event] = args;

            try {
                let { body } = event;
                body = EJSON.parse(body);

                if (!db) {
                    db = await getDatabase();
                }

                const { collection, operation } = body;
                if (!collection) {
                    throw new Error(
                        "Collection on which the operation needs to be executed wasn't set."
                    );
                }

                const [operationName, ...operationArgs] = operation;
                if (typeof operationName !== "string") {
                    throw new Error("Operation name wasn't received.");
                }

                if (logCollection) {
                    try {
                        await db.collection(logCollection).insertOne({
                            collection,
                            operationName,
                            operationArgs: JSON.stringify(operationArgs)
                        });
                    } catch (err) {
                        console.log(`Error logging query: ${err.message}`);
                    }
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
        }
    };
};

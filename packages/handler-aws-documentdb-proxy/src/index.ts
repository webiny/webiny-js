import { Db, MongoClient } from "mongodb";
import { EJSON } from "bson";
import { HandlerPlugin } from "@webiny/handler/types";
import ca from "./ca";

interface AwsDocumentDbProxyOptions {
    logCollection?: string;
    server?: string;
    database?: string;
    username?: string;
    password?: string;
    db?: Db;
}

export default ({
    logCollection,
    server,
    username,
    password,
    database,
    db: dbInstance
}: AwsDocumentDbProxyOptions): HandlerPlugin => {
    let db: Db = dbInstance || null;

    async function getDatabase() {
        if (db) {
            return db;
        }

        const connectionString = `mongodb://${username}:${password}@${server}:27017`;
        const client = await MongoClient.connect(connectionString, {
            ssl: true,
            sslValidate: true,
            sslCA: [ca],
            useNewUrlParser: true,
            useUnifiedTopology: true,

        });

        return client.db(database);
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

            if (findRestArgs.project) {
                results.project(findRestArgs.project);
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

                const results = [];
                for (let i = 0; i < body.operations.length; i++) {
                    const { collection, operation } = body.operations[i];

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

                    results.push(await executeOperation(collection, operationName, operationArgs));
                }

                return { response: EJSON.stringify({ results }) };
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

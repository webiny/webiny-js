import { MongoClient } from "mongodb";
import { MongoDbDriver, id } from "@commodo/fields-storage-mongodb";
import { GraphQLContextPlugin } from "@webiny/api/types";

let database = null;
let client = null;

async function getDatabase({ server, name }) {
    const client = await MongoClient.connect(server, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return { database: client.db(name), client };
}

export type CommodoMongoDBFactoryOptions = {
    test?: {
        afterAll(cb: Function): void;
    };
    database: {
        server: string;
        name: string;
    };
};

export default (options: CommodoMongoDBFactoryOptions): GraphQLContextPlugin => ({
    name: "graphql-context-commodo",
    type: "graphql-context",
    async preApply(context) {
        if (!context.commodo) {
            context.commodo = {};
        }

        if (!context.commodo.fields) {
            context.commodo.fields = {};
        }

        context.commodo.fields.id = id;

        if (process.env.NODE_ENV === "test") {
            // During tests, references to client and database are handled differently.
            // We need to keep them in local scope to be able to cleanup.
            const refs = await getDatabase(options.database);
            context.commodo.driver = new MongoDbDriver({ database: refs.database });

            if (options.test) {
                options.test.afterAll(async () => {
                    await refs.client.close();
                });
            }

            return;
        }

        if (!client) {
            const refs = await getDatabase(options.database);
            client = refs.client;
            database = refs.database;
        }
        context.commodo.driver = new MongoDbDriver({ database });
    }
});

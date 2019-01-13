// @flow
import addDays from "date-fns/add_days";
import MongoDbDriver from "webiny-entity-mongodb";
import { MongoClient } from "mongodb";

// Configure default storage

let database = null;
function init() {
    if (database && database.serverConfig.isConnected()) {
        return Promise.resolve(database);
    }

    const dbName = "webinyjs";
    return MongoClient.connect(
        "mongodb://localhost:8014",
        { useNewUrlParser: true }
    ).then(client => {
        return client.db(dbName);
    });
}

export default async () => ({
    database: {
        mongodb: database
    },
    entity: {
        // Instantiate entity driver with DB connection
        driver: new MongoDbDriver({ database: await init() }),
        crud: {
            logs: true,
            read: {
                maxPerPage: 1000
            },
            delete: {
                soft: true
            }
        }
    },
    security: {
        enabled: false,
        token: {
            secret: process.env.JWT_SECRET || "MyS3cr3tK3Y",
            expiresOn: (args: Object) => addDays(new Date(), args.remember ? 30 : 1)
        }
    }
});

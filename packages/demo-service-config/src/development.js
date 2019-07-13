// @flow
import addDays from "date-fns/add_days";
import MongoDbDriver from "webiny-entity-mongodb";
import { MongoClient } from "mongodb";

// Configure default storage

let database = null;
async function init() {
    if (database && database.serverConfig.isConnected()) {
        return database;
    }

    const server = process.env.MONGODB_SERVER;
    const databaseName = process.env.MONGODB_DB_NAME;
    const client = await MongoClient.connect(server, { useNewUrlParser: true });

    return client.db(databaseName);
}

export default async (context: Object) => {
    database = await init();

    return {
        apollo: {
            introspection: context.devMode === true,
            playground: context.devMode === true
        },
        database: {
            mongodb: database
        },
        entity: {
            // Instantiate entity driver with DB connection
            driver: new MongoDbDriver({ database }),
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
            enabled: true,
            token: {
                secret: process.env.WEBINY_JWT_SECRET,
                expiresOn: () => addDays(new Date(), 30)
            }
        }
    };
};

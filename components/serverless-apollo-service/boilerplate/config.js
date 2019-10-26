import addDays from "date-fns/addDays";
import { MongoClient } from "mongodb";

// Configure default storage
let database = null;
async function init() {
    if (database && database.serverConfig.isConnected()) {
        return database;
    }

    const server = process.env.MONGODB_SERVER;
    const databaseName = process.env.MONGODB_NAME;
    const client = await MongoClient.connect(server, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    return client.db(databaseName);
}

export default async () => {
    database = await init();

    return {
        apollo: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        },
        database: {
            mongodb: database
        },
        security: {
            token: {
                secret: process.env.JWT_SECRET,
                expiresOn: () => addDays(new Date(), 30)
            }
        }
    };
};

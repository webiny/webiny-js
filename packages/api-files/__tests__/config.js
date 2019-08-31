import MongoDbDriver from "@webiny/entity-mongodb";
import { Entity } from "@webiny/entity";
import { MongoClient } from "mongodb";

export default async () => {
    const client = await MongoClient.connect(global.__MONGO_URI__, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const database = await client.db(global.__MONGO_DB_NAME__);

    // Configure Entity
    Entity.driver = new MongoDbDriver({ database });
    Entity.crud = {
        logs: true,
        read: {
            maxPerPage: 1000
        },
        delete: {
            soft: true
        }
    };

    return { client, database };
};

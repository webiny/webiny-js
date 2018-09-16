// @flow
import mysql from "mysql";
import { User, ApiToken } from "webiny-api/entities";
import { createIdentity, credentialsStrategy } from "webiny-api/security";
import { MySQLDriver } from "webiny-entity-mysql";
import type { Api } from "webiny-api";

// Configure default storage
const connection = mysql.createPool({
    host: "localhost",
    port: 32768,
    user: "root",
    password: "dev",
    database: "webiny",
    timezone: "Z",
    connectionLimit: 100
});

export default () => ({
    database: {
        connection
    },
    entity: {
        // Instantiate driver with DB connection
        driver: new MySQLDriver({ connection })
        /*
        // TODO: this requires discussion and planning as we are moving file uploads to S3
        attributes: ({ fileAttributes, imageAttributes }) => {
            fileAttributes({
                entity: File,
                storage: new Storage(localDriver)
            });
            imageAttributes({
                entity: Image,
                processor: imageProcessor(),
                quality: 90,
                storage: new Storage(localDriver)
            });
        }*/
    },
    security: {
        enabled: false,
        token: { secret: "MyS3cr3tK3Y" },
        identities: [
            createIdentity(User, { strategy: credentialsStrategy(), type: "SecurityUsers" }),
            createIdentity(ApiToken)
        ]
    },
    hooks: {
        postHandle: ({ api }: { api: Api }) => {
            // In development, SLS Offline always does "cold starts". This means each time a request has
            // been made, a new connection pool would be created. And while in production environment, when a
            // Lambda is closed, all connections would be terminated, in development mode that is not the case.
            // Established connections would still linger and eventually we would hit MySQL max connections limit.
            // This prevents it.
            api.config.database.connection.end();
        }
    }
});

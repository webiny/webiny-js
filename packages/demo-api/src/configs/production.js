import mysql from "mysql";
import { User, ApiToken } from "webiny-api/entities";
import { createIdentity, credentialsStrategy } from "webiny-api/security";
import { MySQLDriver } from "webiny-entity-mysql";

const connection = mysql.createPool({
    host: process.env.WEBINY_DB_HOST,
    port: process.env.WEBINY_DB_PORT || 3306,
    user: process.env.WEBINY_DB_USER,
    password: process.env.WEBINY_DB_PASSWORD,
    database: process.env.WEBINY_DB_NAME,
    timezone: "Z",
    connectionLimit: 10
});

export default {
    entity: {
        // Instantiate driver with DB connection
        driver: new MySQLDriver({ connection }),
    },
    security: {
        token: { secret: "MyS3cr3tK3Y" },
        identities: [
            createIdentity(User, { strategy: credentialsStrategy() }),
            createIdentity(ApiToken)
        ]
    }
};

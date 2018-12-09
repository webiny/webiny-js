// @flow
import mysql from "serverless-mysql";
import addDays from "date-fns/add_days";
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
    database: {
        connection
    },
    entity: {
        // Instantiate entity driver with DB connection
        driver: new MySQLDriver({ connection }),
        crud: {
            logs: true,
            read: {
                maxPerPage: 100
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
};

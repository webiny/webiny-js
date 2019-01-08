// @flow
import mysql from "serverless-mysql";
import addDays from "date-fns/add_days";
import { MySQLDriver } from "webiny-entity-mysql";

// Configure default storage
const connection = mysql({
    config: {
        host: "localhost",
        port: 32768,
        user: "root",
        password: "dev",
        database: "webiny",
        timezone: "Z",
        connectionLimit: 100
    }
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
            secret: process.env.JWT_SECRET || "MyS3cr3tK3Y",
            expiresOn: (args: Object) => addDays(new Date(), args.remember ? 30 : 1)
        }
    }
};

// @flow
import addDays from "date-fns/add_days";
import { MySQLDriver } from "webiny-entity-mysql";

export default {
    entity: {
        // Instantiate entity driver with DB connection
        driver: new MySQLDriver({
            mysql: {
                host: "localhost",
                port: 32768,
                user: "root",
                password: "dev",
                database: "webiny",
                timezone: "Z",
                connectionLimit: 100
            }
        }),
        crud: {
            logs: true,
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

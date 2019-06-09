// @flow
import addDays from "date-fns/add_days";
import MongoDbDriver from "webiny-entity-mongodb";

export default async (context: Object) => {
    return {
        apollo: {
            introspection: context.devMode === true,
            playground: context.devMode === true
        },
        database: {
            mongodb: context.database
        },
        entity: {
            // Instantiate entity driver with DB connection
            driver: new MongoDbDriver({ database: context.database }),
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
                secret: context.jwtSecret,
                expiresOn: () => addDays(new Date(), 30)
            }
        }
    };
};

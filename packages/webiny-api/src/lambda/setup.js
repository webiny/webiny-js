// @flow
import { Entity } from "webiny-entity";

export default async (config: Object = {}) => {
    // Configure Entity layer
    if (config.entity) {
        Entity.driver = config.entity.driver;
        Entity.crud = config.entity.crud;
    }

    // Check if connection is valid and if Settings table exists - this will tell us if the system is installed.
    if (process.env.NODE_ENV === "development") {
        try {
            await Entity.getDriver().test();
        } catch (e) {
            throw Error(
                `The following error occurred while initializing Entity driver: "${
                    e.message
                    }". Did you enter the correct database information?`
            );
        }
    }
};

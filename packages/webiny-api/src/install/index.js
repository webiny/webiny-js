// @flow
import { Entity } from "webiny-entity";
import createMySQLTables from "./createMySQLTables";
import importData from "./importData";

export default async (config: Object) => {
    // Configure Entity layer
    if (config.entity) {
        Entity.driver = config.entity.driver;
        Entity.crud = config.entity.crud;
    }
    await createMySQLTables(config);
    await importData(config);
};

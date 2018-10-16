// @flow
import createMySQLTables from "./createMySQLTables";
import importData from "./importData";

export default async (config: Object) => {
    await createMySQLTables();
    await importData(config);
};

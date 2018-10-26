// @flow
import createMySQLTables from "./createMySQLTables";
import importData from "./importData";

export default async (context: Object) => {
    await createMySQLTables();
    await importData(context);
};

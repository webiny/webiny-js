// @flow
import { addPlugin } from "webiny-api/plugins";
import plugins from "../plugins";
import createMySQLTables from "./createMySQLTables";
import importData from "./importData";

export default async (context: Object) => {
    addPlugin(...plugins);
    await createMySQLTables();
    await importData(context);
};

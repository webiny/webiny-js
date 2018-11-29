// @flow
import { addPlugin } from "webiny-api/plugins";
import plugins from "../plugins";
import createMySQLTables from "./createMySQLTables";
import importData from "./importData";

addPlugin({
    type: "webiny-install",
    name: "webiny-install-api",
    install: async context => {
        addPlugin(...plugins);
        await createMySQLTables();
        await importData(context);
});

// @flow
import { type InstallPluginType } from "webiny-install/types";

import createMySQLTables from "./createMySQLTables";
import importData from "./importData";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-cms",
    meta: {
        name: "Webiny CMS",
        description: "Webiny CMS is a powerful content management system (CMS)."
    },
    install: async context => {
        await createMySQLTables();
        await importData(context);
    }
};

export default [plugin];

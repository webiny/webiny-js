// @flow
import { addPlugin } from "webiny-plugins";
import { type InstallPluginType } from "webiny-install/types";

import plugins from "../plugins";
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
        addPlugin(...plugins);
        await createMySQLTables();
        await importData(context);
    }
};

addPlugin(plugin);

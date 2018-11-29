// @flow
import { addPlugin } from "webiny-plugins";
import plugins from "../plugins";
import createMySQLTables from "./createMySQLTables";
import importData from "./importData";

addPlugin({
    type: "webiny-install",
    name: "webiny-install-cms",
    meta: {
        name: "Webiny CMS",
        description: "Webiny CMS is a powerful content management system (CMS)."
    },
    install: async context => {
        addPlugin(...plugins);
        await createMySQLTables();
        await importData(context);
    }
});

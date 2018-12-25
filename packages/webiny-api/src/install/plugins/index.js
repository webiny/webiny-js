// @flow
import createMySQLTables from "./createMySQLTables";
import { type InstallPluginType } from "webiny-install/types";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-api",
    meta: {
        name: "Webiny API",
        description: "Foundation of the Webiny platform."
    },
    install: async (context: Object) => {
        const { config } = context;
        await createMySQLTables(config);
    }
};

export default [plugin];

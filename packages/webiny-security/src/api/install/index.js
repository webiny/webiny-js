// @flow
import { Entity } from "webiny-entity";
import createMySQLTables from "./createMySQLTables";
import importData from "./importData";
import { addPlugin } from "webiny-plugins";
import { type InstallPluginType } from "webiny-install/types";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-api",
    meta: {
        name: "Webiny API",
        description: "Foundation of the Webiny platform."
    },
    install: async context => {
        const { config } = context;

        // Configure Entity layer
        if (config.entity) {
            Entity.driver = config.entity.driver;
            Entity.crud = config.entity.crud;
        }

        await createMySQLTables(config);
        await importData(context);
    }
};

addPlugin(plugin);

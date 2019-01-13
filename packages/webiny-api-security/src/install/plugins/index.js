// @flow
import { Entity } from "webiny-entity";
import importData from "./importData";
import { type InstallPluginType } from "webiny-install/types";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-security",
    meta: {
        name: "Webiny Security",
        description: "A complete layer for securing your app / GraphQL."
    },
    install: async context => {
        const { config } = context;

        // Configure Entity layer
        if (config.entity) {
            Entity.driver = config.entity.driver;
            Entity.crud = config.entity.crud;
        }

        await importData(context);
    }
};

export default [plugin];

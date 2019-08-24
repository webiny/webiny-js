// @flow
import { Entity } from "@webiny/entity";
import importData from "./importData";
import { type InstallPluginType } from "@webiny/install/types";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-i18n",
    meta: {
        name: "Webiny I18N",
        description: "I18N app that lets you manage available locales and translations."
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

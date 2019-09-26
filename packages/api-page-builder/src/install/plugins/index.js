// @flow
import { type InstallPluginType } from "@webiny/install/types";
import { general, seo, social } from "@webiny/api-page-builder/plugins/pageSettings";
import importData from "./importData";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-cms",
    meta: {
        name: "Webiny PB",
        description: "Webiny PB is a powerful visual page builder."
    },
    install: async context => {
        await importData(context);
    }
};

export default [plugin, general, seo, social];

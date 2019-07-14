// @flow
import { type InstallPluginType } from "webiny-install/types";
import { general, seo, social } from "webiny-api-cms/plugins/pageSettings";
import importData from "./importData";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-cms",
    meta: {
        name: "Webiny CMS",
        description: "Webiny CMS is a powerful content management system (CMS)."
    },
    install: async context => {
            await importData(context);
    }
};

export default [plugin, general, seo, social];

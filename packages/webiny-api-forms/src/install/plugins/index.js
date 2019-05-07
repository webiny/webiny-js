// @flow
import { type InstallPluginType } from "webiny-install/types";
import { general, seo, social } from "webiny-api-forms/plugins/formSettings";

const plugin: InstallPluginType = {
    type: "install",
    name: "install-forms",
    meta: {
        name: "Webiny FORMS",
        description: "Webiny FORMS is a powerful content management system (FORMS)."
    },
    install: async context => {
        await importData(context);
    }
};

export default [plugin, general, seo, social];

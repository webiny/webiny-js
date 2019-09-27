// @flow
import { createHandler, PluginsContainer } from "@webiny/api";
import createConfig from "service-config";
import securityPlugins from "@webiny/api-security/plugins/service";
import pageBuilderPlugins from "@webiny/api-page-builder/plugins";
import mailchimpPlugins from "@webiny/api-mailchimp";
import gtmPlugins from "@webiny/api-google-tag-manager";
import cookiePolicyPlugins from "@webiny/api-cookie-policy";
import i18nPlugins from "@webiny/api-i18n/plugins/service";

let apolloHandler;

export const handler = async (event: Object, context: Object) => {
    if (!apolloHandler) {
        const config = await createConfig();
        const plugins = new PluginsContainer([
            securityPlugins,
            i18nPlugins,
            pageBuilderPlugins(config),
            mailchimpPlugins,
            gtmPlugins,
            cookiePolicyPlugins
        ]);

        const { handler } = await createHandler({ plugins, config });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};

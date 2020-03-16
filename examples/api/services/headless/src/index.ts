import { createHandler } from "@webiny/http-handler";
import headlessHandler from "@webiny/api-headless-cms/handler";
import createApolloHandler from "@webiny/api-plugin-create-apollo-handler";
import securityService from "@webiny/api-security/plugins/service";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import i18nPlugins from "@webiny/api-i18n/plugins/service";
import headlessPlugins from "@webiny/api-headless-cms/plugins";

declare const APOLLO_HANDLER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;

export const handler = createHandler(
    headlessHandler({
        plugins: [
            createApolloHandler(APOLLO_HANDLER_OPTIONS),
            dbProxy(DB_PROXY_OPTIONS),
            securityService(SECURITY_OPTIONS),
            i18nPlugins(),
            headlessPlugins()
        ]
    })
);

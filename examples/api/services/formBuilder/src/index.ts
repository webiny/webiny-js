import { createHandler } from "@webiny/http-handler";
import apolloServerPlugins from "@webiny/http-handler-apollo-server";
import dbProxyPlugins from "@webiny/api-plugin-commodo-db-proxy";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import i18nServicePlugins from "@webiny/api-i18n/plugins/service";
import formBuilderPlugins from "@webiny/api-form-builder/plugins";
import useSsrCacheTagsPlugins from "@webiny/api-form-builder/plugins/useSsrCacheTags";

declare const APOLLO_SERVER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;
declare const I18N_OPTIONS: any;

export const handler = createHandler(
    apolloServerPlugins(APOLLO_SERVER_OPTIONS),
    dbProxyPlugins(DB_PROXY_OPTIONS),
    securityServicePlugins(SECURITY_OPTIONS),
    i18nServicePlugins(I18N_OPTIONS),
    formBuilderPlugins(),
    useSsrCacheTagsPlugins()
);

import { createHandler } from "@webiny/handler";
import headlessCmsHandler from "@webiny/api-headless-cms/handler";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import securityService from "@webiny/api-security/plugins/service";
import i18nPlugins from "@webiny/api-i18n/plugins/service";

declare const APOLLO_SERVER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;
declare const I18N_OPTIONS: any;

export const handler = createHandler(
    headlessCmsHandler(APOLLO_SERVER_OPTIONS),
    dbProxy(DB_PROXY_OPTIONS),
    securityService(SECURITY_OPTIONS),
    i18nPlugins(I18N_OPTIONS)
);

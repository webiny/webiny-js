import { createHandler } from "@webiny/http-handler";
import httpHandlerApolloServerPlugins from "@webiny/http-handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import securityPlugins from "@webiny/api-security/plugins";
import cognitoPlugins from "@webiny/api-plugin-security-cognito";

declare const HTTP_HANDLER_APOLLO_SERVER_OPTIONS: any;
declare const DB_PROXY_OPTIONS: any;
declare const SECURITY_OPTIONS: any;
declare const COGNITO_OPTIONS: any;

export const handler = createHandler(
    httpHandlerApolloServerPlugins(HTTP_HANDLER_APOLLO_SERVER_OPTIONS),
    dbProxy(DB_PROXY_OPTIONS),
    securityPlugins(SECURITY_OPTIONS),
    cognitoPlugins(COGNITO_OPTIONS)
);

import models from "./models";
import graphql from "./graphql";
import securityAuthenticationPlugins from "@webiny/api-security/plugins/authentication";
import securityAuthJwtPlugins, { JwtAuthOptions } from "@webiny/api-security/plugins/auth/jwt";
import securityAuthPatPlugins from "@webiny/api-security/plugins/auth/pat";

export default (options: JwtAuthOptions) => [
    models(),
    graphql,
    securityAuthenticationPlugins(),
    securityAuthJwtPlugins(options),
    securityAuthPatPlugins()
];

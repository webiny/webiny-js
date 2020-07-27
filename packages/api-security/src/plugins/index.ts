import models from "./models";
import graphql from "./graphql";
import securityAuthPlugins from "@webiny/api-security/plugins/auth";
import securityAuthJwtPlugins, { JwtAuthOptions } from "@webiny/api-security/plugins/auth/jwt";
import securityAuthPatPlugins from "@webiny/api-security/plugins/auth/pat";

export default (options: JwtAuthOptions) => [
    models(),
    graphql,
    securityAuthPlugins(),
    securityAuthJwtPlugins(options),
    securityAuthPatPlugins()
];

import { Context as HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { SecurityIdentity } from "@webiny/api-security";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { AuthenticationPlugin } from "@webiny/api-security/plugins/AuthenticationPlugin";
type Context = HandlerContext<HttpContext, TenancyContext>;

interface Config {
    identityType: string;
}

export class PersonalAccessTokenAuthenticationPlugin extends AuthenticationPlugin<Context> {
    private _config: Config;

    constructor(config: Config) {
        super();
        this._config = config;
    }

    async authenticate(context: Context) {
        const { headers } = context.http.request;
        const header = headers["Authorization"] || headers["authorization"];
        const token = header ? header.split(" ").pop() : null;
        if (!token || !token.startsWith("p")) {
            return;
        }

        // Try loading a User using the value from header
        const user = await context.security.users.getUserByPersonalAccessToken(token);

        if (user) {
            return new SecurityIdentity({
                id: user.login,
                type: this._config.identityType,
                displayName: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName
            });
        }
    }
}

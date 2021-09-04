import { Context as HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { SecurityIdentity } from "@webiny/api-security";
import { AuthenticationPlugin } from "@webiny/api-security/plugins/AuthenticationPlugin";
import { TenancyContext } from "@webiny/api-tenancy/types";
type Context = HandlerContext<HttpContext, TenancyContext>;

export interface Config {
    identityType?: string;
}

export class APIKeyAuthenticationPlugin extends AuthenticationPlugin<Context> {
    private _config: Config;

    constructor(config?: Config) {
        super();
        this._config = config || {};
    }

    async authenticate(context: Context) {
        const { headers } = context.http.request;
        const header = headers["Authorization"] || headers["authorization"];
        const token = header ? header.split(" ").pop() : null;
        if (!token || !token.startsWith("a")) {
            return;
        }

        const identityType = this._config.identityType || "api-key";
        const apiKey = await context.security.apiKeys.getApiKeyByToken(token);

        if (apiKey) {
            return new SecurityIdentity({
                id: apiKey.id,
                displayName: apiKey.name,
                type: identityType,
                // Add permissions directly to the identity so we don't have to load them
                // again when authorization kicks in.
                permissions: apiKey.permissions
            });
        }
    }
}

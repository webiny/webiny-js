import { SecurityAuthenticationPlugin } from "@webiny/api-security/types";
import { Context as HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { SecurityIdentity } from "@webiny/api-security";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
type Context = HandlerContext<HttpContext, TenancyContext>;

type APIKeyAuthentication = {
    identityType?: string;
};

export default (config: APIKeyAuthentication = {}): SecurityAuthenticationPlugin => {
    return {
        type: "security-authentication",
        async authenticate(context: Context) {
            const { headers } = context.http;
            const header = headers["Authorization"] || headers["authorization"];
            const token = header ? header.split(" ").pop() : null;
            if (!token || !token.startsWith("a")) {
                return;
            }

            const identityType = config.identityType || "api-key";
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
    };
};

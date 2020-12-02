import { SecurityAuthenticationPlugin } from "@webiny/api-security/types";
import { Context as HandlerContext } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { SecurityIdentity } from "@webiny/api-security";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
type Context = HandlerContext<HttpContext, TenancyContext>;

export default ({ identityType }) => {
    return {
        type: "security-authentication",
        async authenticate(context: Context) {
            const { headers } = context.http;
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
                    type: identityType,
                    displayName: `${user.firstName} ${user.lastName}`,
                    firstName: user.firstName,
                    lastName: user.lastName
                });
            }
        }
    } as SecurityAuthenticationPlugin;
};

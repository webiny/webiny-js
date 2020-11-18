import { SecurityAuthenticationPlugin } from "@webiny/api-security/types";
import { SecurityIdentity } from "@webiny/api-security";
import { HttpContext } from "@webiny/handler-http/types";
import { Context } from "@webiny/handler/types";

const getAuthorizationToken = context => {
    const { headers = {} } = context.http;
    return (headers.authorization || headers.Authorization).replace(/bearer\s/i, "");
};

export default {
    name: "security-access-token",
    type: "security-authentication",
    authenticate: async (context: Context & HttpContext) => {
        const { CmsAccessToken } = context.models;

        const accessToken = getAuthorizationToken(context);
        if (!accessToken) {
            return;
        }

        const token = await CmsAccessToken.findOne({
            query: { token: accessToken }
        });

        if (!token) {
            return;
        }

        return new SecurityIdentity({
            id: token.id,
            login: accessToken,
            type: "cms-access-token"
        });
    }
} as SecurityAuthenticationPlugin;

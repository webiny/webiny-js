import { JwtToken } from "./jwtToken";
import { Context } from "@webiny/graphql/types";
import { SecurityIdentity } from "@webiny/api-security/utils";

const isJwt = token => token.split(".").length === 3; // All JWTs are split into 3 parts by two periods
import { SecurityAuthenticationPlugin } from "@webiny/api-security/types";

export type JwtAuthOptions = {
    secret: string;
};

export default (options: JwtAuthOptions) => [
    {
        type: "authentication",
        name: "authentication-jwt",
        async authenticate(context: Context) {
            const [event] = context.args;
            const { headers = {} } = event;
            const authorization = headers["Authorization"] || headers["authorization"] || "";

            if (!authorization) {
                return;
            }

            if (isJwt(authorization)) {
                const token = authorization.replace(/bearer\s/i, "");
                let user = null;
                if (token !== "" && event.httpMethod === "POST") {
                    const jwt = new JwtToken({ secret: options.secret });
                    user = (await jwt.decode(token)).data;

                    return new SecurityIdentity({
                        id: user.id,
                        email: user.email,
                        displayName: user.displayName,
                        scopes: user.scopes
                    });
                }
            }
        }
    } as SecurityAuthenticationPlugin
];

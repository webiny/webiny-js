import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import util from "util";
import { SecurityIdentity } from "@webiny/api-security";
import { SecurityAuthenticationPlugin } from "@webiny/api-security/types";
import { HttpContext } from "@webiny/handler-http/types";
import { Context } from "@webiny/handler/types";
const verify = util.promisify(jwt.verify);

// All JWTs are split into 3 parts by two periods
const isJwt = token => token.split(".").length === 3;

type CognitoAuthOptions = {
    region: string;
    userPoolId: string;
    identityType: string;
    getIdentity?(
        params: { identityType: string; token: { [key: string]: any } },
        context: Context
    ): SecurityIdentity;
};

export default ({ region, userPoolId, identityType, getIdentity }: CognitoAuthOptions) => {
    let jwksCache = null;
    const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

    const getJWKs = async () => {
        if (!jwksCache) {
            const response = await fetch(url).then(res => res.json());
            jwksCache = response.keys;
        }

        return jwksCache;
    };

    return [
        {
            type: "security-authentication",
            async authenticate(context: Context<HttpContext>) {
                const { method: httpMethod, headers = {} } = context.http;
                let idToken = headers["Authorization"] || headers["authorization"] || "";

                if (!idToken) {
                    return;
                }

                idToken = idToken.replace(/bearer\s/i, "");

                if (isJwt(idToken) && httpMethod === "POST") {
                    const jwks = await getJWKs();
                    const { header } = jwt.decode(idToken, { complete: true });
                    const jwk = jwks.find(key => key.kid === header.kid);

                    if (!jwk) {
                        return;
                    }

                    const token = await verify(idToken, jwkToPem(jwk));
                    if (token.token_use !== "id") {
                        const error = new Error("idToken is invalid!");
                        throw Object.assign(error, {
                            code: "SECURITY_COGNITO_INVALID_TOKEN"
                        });
                    }

                    if (typeof getIdentity === "function") {
                        return getIdentity({ identityType, token }, context);
                    }

                    return new SecurityIdentity({
                        id: token.sub,
                        login: token.email,
                        type: identityType,
                        firstName: token.given_name,
                        lastName: token.family_name
                    });
                }
            }
        } as SecurityAuthenticationPlugin
    ];
};

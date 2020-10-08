import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import request from "request-promise";
import util from "util";
import { Context } from "@webiny/graphql/types";
import { SecurityIdentity } from "@webiny/api-security";
import { SecurityAuthenticationPlugin } from "@webiny/api-security/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
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
            const body = await request({ url, json: true });
            jwksCache = body.keys;
        }

        return jwksCache;
    };

    return [
        {
            type: "security-authentication",
            async authenticate(context: Context & HandlerHttpContext) {
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

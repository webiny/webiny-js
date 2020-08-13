import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import request from "request-promise";
import util from "util";
import { Context } from "@webiny/graphql/types";
import { SecurityIdentity } from "@webiny/api-security";
import { SecurityPlugin } from "@webiny/api-security/types";

const verify = util.promisify(jwt.verify);

// All JWTs are split into 3 parts by two periods
const isJwt = token => token.split(".").length === 3;

type CognitoAuthOptions = {
    region: string;
    userPoolId: string;
};

export default (options: CognitoAuthOptions) => {
    let jwksCache = null;
    const url = `https://cognito-idp.${options.region}.amazonaws.com/${options.userPoolId}/.well-known/jwks.json`;

    const getJWKs = async () => {
        if (!jwksCache) {
            const body = await request({ url, json: true });
            jwksCache = body.keys;
        }

        return jwksCache;
    };

    return [
        {
            type: "security",
            name: "authentication-cognito-idtoken",
            async authenticate(context: Context) {
                const [event] = context.args;
                const { headers = {} } = event;
                let idToken = headers["Authorization"] || headers["authorization"] || "";

                if (!idToken) {
                    return;
                }

                idToken = idToken.replace(/bearer\s/i, "");

                if (isJwt(idToken)) {
                    if (idToken !== "" && event.httpMethod === "POST") {
                        const jwks = await getJWKs();
                        const { header } = jwt.decode(idToken, { complete: true });
                        const jwk = jwks.find(key => key.kid === header.kid);

                        const token = await verify(idToken, jwkToPem(jwk));
                        if (token.token_use !== "id") {
                            const error = new Error("idToken is invalid!");
                            throw Object.assign(error, {
                                code: "SECURITY_COGNITO_INVALID_TOKEN"
                            });
                        }

                        return new SecurityIdentity({
                            id: token.sub,
                            login: token.email,
                            type: "cognito-user",
                            firstName: token.given_name,
                            lastName: token.family_name
                        });
                    }
                }
            }
        } as SecurityPlugin
    ];
};

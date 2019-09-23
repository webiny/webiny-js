import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import request from "request-promise";
import util from "util";

const verify = util.promisify(jwt.verify);
let jwksCache = null;

export default ({ region, userPoolId }) => {
    const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

    const getJWKs = async () => {
        if (!jwksCache) {
            const body = await request({ url, json: true });
            jwksCache = body.keys;
        }

        return jwksCache;
    };

    return {
        name: "security-authentication-provider-cognito",
        type: "security-authentication-provider",
        async getEmail({ idToken }) {
            const jwks = await getJWKs();

            let jwt;
            for (let i = 0; i < jwks.length; i++) {
                try {
                    jwt = await verify(idToken, jwkToPem(jwks[i]));
                    break;
                } catch (e) {
                    // If verification failed, continue to next JWK
                }
            }

            if (!jwt) {
                const error = new Error("Unable to verify idToken!");
                throw Object.assign(error, {
                    code: "SECURITY_COGNITO_NOT_VERIFIED"
                });
            }

            if (jwt.token_use !== "id") {
                const error = new Error("idToken is invalid!");
                throw Object.assign(error, {
                    code: "SECURITY_COGNITO_INVALID_TOKEN"
                });
            }

            return jwt.email;
        }
    };
};

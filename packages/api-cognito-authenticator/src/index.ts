import jwt, { JsonWebTokenError } from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import util from "util";
const verify = util.promisify<string, string, Record<string, any>>(jwt.verify);

// All JWTs are split into 3 parts by two periods
const isJwt = token => token.split(".").length === 3;

export interface Config {
    region: string;
    userPoolId: string;
}

const jwksCache = new Map<string, Record<string, any>[]>();

export interface Authenticator {
    (token: string): Record<string, any> | undefined;
}

export const createAuthenticator =
    (config: Config): Authenticator =>
    async idToken => {
        const getJWKsURL = () => {
            const { region, userPoolId } = config;
            return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
        };

        const getJWKs = async () => {
            const { region, userPoolId } = config;
            const key = `${region}:${userPoolId}`;

            if (!jwksCache.has(key)) {
                const response = await fetch(getJWKsURL()).then(res => res.json());
                jwksCache.set(key, response.keys);
            }

            return jwksCache.get(key);
        };

        if (typeof idToken === "string" && isJwt(idToken)) {
            try {
                const jwks = await getJWKs();
                const decodedToken = jwt.decode(idToken, { complete: true });
                // JWT can return null
                if (!decodedToken) {
                    return;
                }

                const header = decodedToken.header;
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

                return token;
            } catch (e) {
                if (e instanceof JsonWebTokenError) {
                    // handle JWT parsing errors and fallback to unauthenticated user
                    return;
                }

                throw e;
            }
        }
    };

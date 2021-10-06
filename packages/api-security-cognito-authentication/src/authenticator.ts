import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import util from "util";
import { SecurityIdentity } from "@webiny/api-security/types";
import { Authenticator } from "@webiny/api-authentication/types";
const verify = util.promisify<string, string, Record<string, any>>(jwt.verify);

// All JWTs are split into 3 parts by two periods
const isJwt = token => token.split(".").length === 3;

export interface Config {
    region: string;
    userPoolId: string;
    identityType: string;
    getIdentity?(params: { identityType: string; token: { [key: string]: any } }): SecurityIdentity;
}

const jwksCache = new Map<string, Record<string, any>[]>();

export const authenticator =
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

        if (isJwt(idToken)) {
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

            if (typeof config.getIdentity === "function") {
                return config.getIdentity({ identityType: config.identityType, token });
            }

            return {
                id: token.sub,
                type: config.identityType,
                displayName: `${token.given_name} ${token.family_name}`,
                // This is necessary for migration to the new `adminUsers` app and will removed in the future versions.
                email: token.email
            };
        }
    };

import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import util from "util";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import Error from "@webiny/error";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
const verify = util.promisify<string, string, Record<string, any>>(jwt.verify);

// All JWTs are split into 3 parts by two periods
const isJwt = token => token.split(".").length === 3;

type Context = SecurityContext;

export interface Config {
    // Okta issuer endpoint
    issuer: string;
    // Okta client ID
    clientId: string;
    // Create an identity object using the verified idToken
    getIdentity(params: { token: { [key: string]: any } }): SecurityIdentity;
}

const jwksCache = new Map<string, Record<string, any>[]>();

export const createAuthenticator = (config: Config) => {
    const getJWKs = async () => {
        const key = config.issuer;

        if (!jwksCache.has(key)) {
            const response = await fetch(`${config.issuer}/v1/keys`).then(res => res.json());
            jwksCache.set(key, response.keys);
        }

        return jwksCache.get(key);
    };

    const oktaAuthenticator = async idToken => {
        if (isJwt(idToken)) {
            try {
                const jwks = await getJWKs();
                const { header } = jwt.decode(idToken, { complete: true });
                const jwk = jwks.find(key => key.kid === header.kid);

                if (!jwk) {
                    return;
                }

                const token = await verify(idToken, jwkToPem(jwk));
                if (!token.jti.startsWith("ID.")) {
                    throw new Error("idToken is invalid!", "SECURITY_OKTA_INVALID_TOKEN");
                }

                return token;
            } catch (err) {
                console.log("OktaAuthenticationPlugin", err);
                throw new Error(err.message, "SECURITY_OKTA_INVALID_TOKEN");
            }
        }
    };

    return new ContextPlugin<Context>(({ security }) => {
        security.addAuthenticator(async idToken => {
            const token = await oktaAuthenticator(idToken);

            return config.getIdentity({ token });
        });
    });
};

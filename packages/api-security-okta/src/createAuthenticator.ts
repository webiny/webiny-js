import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import util from "util";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/api";
const verify = util.promisify<string, string, Record<string, any>>(jwt.verify);

interface VerifyResponse {
    jti?: string;
}

// All JWTs are split into 3 parts by two periods
const isJwt = (token: string) => token.split(".").length === 3;

type Context = SecurityContext;

export interface AuthenticatorConfig {
    // Okta issuer endpoint
    issuer: string;
    // Create an identity object using the verified idToken
    getIdentity(params: { token: { [key: string]: any } }): SecurityIdentity;
}

interface JwksCacheItem {
    kid: string;
    [key: string]: string;
}
const jwksCache = new Map<string, JwksCacheItem[]>();

export const createAuthenticator = (config: AuthenticatorConfig) => {
    const getJWKs = async (): Promise<JwksCacheItem[]> => {
        const key = config.issuer;

        if (!jwksCache.has(key)) {
            const response = await fetch(`${config.issuer}/v1/keys`).then(res => res.json());
            jwksCache.set(key, response.keys);
        }

        return jwksCache.get(key) as JwksCacheItem[];
    };

    const oktaAuthenticator = async (idToken?: string) => {
        if (typeof idToken === "string" && isJwt(idToken)) {
            try {
                const jwks = await getJWKs();
                const decoded = jwt.decode(idToken, { complete: true });
                if (!decoded) {
                    return null;
                }
                const { header } = decoded;
                const jwk = jwks.find(key => key.kid === header.kid);

                if (!jwk) {
                    return null;
                }
                /**
                 * Figure out the types.
                 * TODO @ts-refactor
                 */
                // @ts-expect-error
                const token = (await verify(idToken, jwkToPem(jwk))) as VerifyResponse;
                if (!token.jti || !token.jti.startsWith("ID.")) {
                    throw new WebinyError("idToken is invalid!", "SECURITY_OKTA_INVALID_TOKEN");
                }

                return token;
            } catch (err) {
                console.log("OktaAuthenticationPlugin", err);
                throw new WebinyError(err.message, "SECURITY_OKTA_INVALID_TOKEN");
            }
        }
        return null;
    };

    return new ContextPlugin<Context>(({ security }) => {
        security.addAuthenticator(async (idToken?: string) => {
            const token = await oktaAuthenticator(idToken);

            if (!token) {
                return null;
            }

            return config.getIdentity({ token });
        });
    });
};

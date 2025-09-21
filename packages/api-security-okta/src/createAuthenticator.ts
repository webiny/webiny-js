import jwt from "jsonwebtoken";
import { ContextPlugin } from "@webiny/api";
import { isJwt, verifyJwtUsingJwk } from "@webiny/api-security";
import type { SecurityContext, SecurityIdentity, Jwk } from "@webiny/api-security/types.js";
import WebinyError from "@webiny/error";

type Context = SecurityContext;

export interface AuthenticatorConfig {
    // Okta issuer endpoint
    issuer: string;
    // Create an identity object using the verified idToken
    getIdentity(params: { token: { [key: string]: any } }): SecurityIdentity;
}

const jwksCache = new Map<string, Jwk[]>();

export const createAuthenticator = (config: AuthenticatorConfig) => {
    const getJwks = async (): Promise<Jwk[]> => {
        const key = config.issuer;

        if (!jwksCache.has(key)) {
            const response = await fetch(`${config.issuer}/v1/keys`).then(res => res.json());
            jwksCache.set(key, response.keys);
        }

        return jwksCache.get(key) as Jwk[];
    };

    const oktaAuthenticator = async (idToken?: string) => {
        if (typeof idToken === "string" && isJwt(idToken)) {
            try {
                const jwks = await getJwks();
                const decoded = jwt.decode(idToken, { complete: true });
                if (!decoded) {
                    return null;
                }
                const { header } = decoded;
                const jwk = jwks.find(key => key.kid === header.kid);

                if (!jwk) {
                    return null;
                }

                const token = await verifyJwtUsingJwk(idToken, jwk);
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

import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler";

// All JWTs are split into 3 parts by two periods
const isJwt = (token: string) => token.split(".").length === 3;

type Context = SecurityContext;

export interface AuthenticatorConfig {
    // Auth0 domain endpoint
    domain: string;
    // Create an identity object using the verified idToken
    getIdentity(params: { token: { [key: string]: any } }): SecurityIdentity;
}

const jwksCache = new Map<string, jwkToPem.JWK[]>();

type WithKid<T> = T & {
    kid: string;
};

export const createAuthenticator = (config: AuthenticatorConfig) => {
    const getJWKs = async (): Promise<WithKid<jwkToPem.JWK>[]> => {
        const key = config.domain;

        if (!jwksCache.has(key)) {
            const response = await fetch(`${config.domain}/.well-known/jwks.json`).then(res =>
                res.json()
            );
            jwksCache.set(key, response.keys);
        }

        return jwksCache.get(key) as WithKid<jwkToPem.JWK>[];
    };

    const auth0Authenticator = async (idToken?: string) => {
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

                return jwt.verify(idToken, jwkToPem(jwk)) as Record<string, any>;
            } catch (err) {
                throw new WebinyError(err.message, "SECURITY_AUTH0_INVALID_TOKEN");
            }
        }
        return null;
    };

    return new ContextPlugin<Context>(({ security }) => {
        security.addAuthenticator(async (idToken?: string) => {
            const token = await auth0Authenticator(idToken);

            if (!token) {
                return null;
            }

            return config.getIdentity({ token });
        });
    });
};

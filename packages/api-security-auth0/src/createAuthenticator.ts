import jwt from "jsonwebtoken";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { IdentityData } from "@webiny/api-core/features/IdentityContext";
import {
    type Jwk,
    verifyJwtUsingJwk
} from "@webiny/api-core/features/security/utils/verifyJwtUsingJwk.js";
import { isJwt } from "@webiny/api-core/features/security/utils/isJwt.js";

type Context = ApiCoreContext;

export interface AuthenticatorConfig {
    // Auth0 domain endpoint
    domain: string;
    // Create an identity object using the verified idToken
    getIdentity(params: { token: { [key: string]: any } }): IdentityData;
}

const jwksCache = new Map<string, Jwk[]>();

export const createAuthenticator = (config: AuthenticatorConfig) => {
    const getJwks = async (): Promise<Jwk[]> => {
        const key = config.domain;

        if (!jwksCache.has(key)) {
            const response = await fetch(`${config.domain}/.well-known/jwks.json`).then(res =>
                res.json()
            );
            jwksCache.set(key, response.keys);
        }

        return jwksCache.get(key) as Jwk[];
    };

    const auth0Authenticator = async (idToken?: string) => {
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

                return verifyJwtUsingJwk(idToken, jwk);
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

import jwt from "jsonwebtoken";
import { ContextPlugin } from "@webiny/api";
import WebinyError from "@webiny/error";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    type Jwk,
    verifyJwtUsingJwk
} from "@webiny/api-core/features/security/utils/verifyJwtUsingJwk.js";
import { isJwt } from "@webiny/api-core/features/security/utils/isJwt.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

export interface AuthenticatorConfig {
    // Okta issuer endpoint
    issuer: string;
    // Create an identity object using the verified idToken
    getIdentity(params: { token: { [key: string]: any } }): IdentityData;
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

    return new ContextPlugin<ApiCoreContext>(({ security }) => {
        security.addAuthenticator(async (idToken?: string) => {
            const token = await oktaAuthenticator(idToken);

            if (!token) {
                return null;
            }

            return config.getIdentity({ token });
        });
    });
};

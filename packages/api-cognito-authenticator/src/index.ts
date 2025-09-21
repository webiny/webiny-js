import jwt from "jsonwebtoken";
import { isJwt, verifyJwtUsingJwk } from "@webiny/api-security";
import type { Jwk } from "@webiny/api-security/types";

export interface Config {
    region: string;
    userPoolId: string;
}

const jwksCache = new Map<string, Jwk[]>();

export interface TokenData {
    token_use: string;
    sub: string;
}

export interface Authenticator<TTokenData extends TokenData = TokenData> {
    (token: string): Promise<TTokenData | null>;
}

export const createAuthenticator = (config: Config) => {
    return async <TTokenData extends TokenData = TokenData>(idToken: string) => {
        const getJWKsURL = () => {
            const { region, userPoolId } = config;
            return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
        };

        const getJwks = async (): Promise<Jwk[] | undefined> => {
            const { region, userPoolId } = config;
            const key = `${region}:${userPoolId}`;

            if (!jwksCache.has(key)) {
                const response = await fetch(getJWKsURL()).then(res => res.json());
                jwksCache.set(key, response.keys);
            }

            return jwksCache.get(key);
        };

        if (!idToken || typeof idToken !== "string" || isJwt(idToken) === false) {
            return null;
        }

        const jwks = await getJwks();
        if (!jwks) {
            return null;
        }
        const decodedData = jwt.decode(idToken, { complete: true });
        if (!decodedData) {
            return null;
        }
        const { header } = decodedData;

        const jwk = jwks.find(key => key.kid === header.kid);

        if (!jwk) {
            return null;
        }

        const token = (await verifyJwtUsingJwk(idToken, jwk)) as unknown as TTokenData;

        if (token.token_use !== "id") {
            const error: any = new Error("idToken is invalid!");
            error.code = "SECURITY_COGNITO_INVALID_TOKEN";
            throw error;
        }

        return token;
    };
};

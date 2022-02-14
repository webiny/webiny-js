import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";
import fetch from "node-fetch";
import util from "util";
const verify = util.promisify<string, string, Record<string, any>>(jwt.verify);

// All JWTs are split into 3 parts by two periods
const isJwt = (token: string): boolean => token.split(".").length === 3;

export interface Config {
    region: string;
    userPoolId: string;
}

const jwksCache = new Map<string, Record<string, any>[]>();

export interface Authenticator {
    (token: string): Record<string, any> | null;
}

export const createAuthenticator =
    (config: Config): Authenticator =>
    async idToken => {
        const getJWKsURL = () => {
            const { region, userPoolId } = config;
            return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
        };

        const getJWKs = async (): Promise<Record<string, string>[] | undefined> => {
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

        const jwks = await getJWKs();
        if (!jwks) {
            return null;
        }
        const decodedData = jwt.decode(idToken, { complete: true });
        if (!decodedData) {
            return null;
        }
        const { header } = decodedData;
        /**
         * TODO: figure out which type is the jwk variable.
         */
        const jwk: any = jwks.find(key => key.kid === header.kid);

        if (!jwk) {
            return null;
        }
        const token = await verify(idToken, jwkToPem(jwk));
        if (token.token_use !== "id") {
            const error: any = new Error("idToken is invalid!");
            error.code = "SECURITY_COGNITO_INVALID_TOKEN";
            throw error;
        }

        return token;
    };

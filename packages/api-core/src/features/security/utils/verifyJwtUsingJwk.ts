import jwt from "jsonwebtoken";
import { importJWK, exportSPKI } from "jose";

export interface Jwk {
    kid: string;
    [key: string]: string;
}

export type Jwt = string;

export const verifyJwtUsingJwk = async (token: Jwt, jwk: Jwk) => {
    // Casting to `any` because `jose` v5 has some incompatibilities with types.
    // v6 works as expected, but we can't have v6 because it's ESM-only.
    const key = (await importJWK(jwk as any)) as CryptoKey;
    const pemKey = await exportSPKI(key);

    return jwt.verify(token, pemKey) as jwt.JwtPayload;
};

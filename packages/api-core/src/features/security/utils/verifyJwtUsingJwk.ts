import jwt from "jsonwebtoken";
import { exportSPKI, importJWK, type JWK } from "jose";

export type Jwk = JWK;

export type Jwt = {
    header: jwt.JwtHeader;
    payload: jwt.JwtPayload;
};

export const verifyJwtUsingJwk = async (token: string, jwk: Jwk) => {
    // Casting to `any` because `jose` v5 has some incompatibilities with types.
    // v6 works as expected, but we can't have v6 because it's ESM-only.
    const key = (await importJWK(jwk)) as CryptoKey;
    const pemKey = await exportSPKI(key);

    return jwt.verify(token, pemKey) as jwt.JwtPayload;
};

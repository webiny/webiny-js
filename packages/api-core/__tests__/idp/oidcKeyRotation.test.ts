import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import { Container } from "@webiny/di";
import { describe, expect, it, vi } from "vitest";
import { JwkCache } from "~/idp/abstractions.js";
import { JwtIdentityProvider } from "~/idp/abstractions.js";
import { OidcIdentityProvider } from "~/idp/abstractions.js";
import { OidcJwtIdentityProvider } from "~/idp/OidcJwtIdentityProvider.js";

const ISSUER = "https://idp.example.com/realm";

const createKey = (kid: string) => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: "jwk" }), kid, alg: "RS256", use: "sig" };
    return { privateKey, jwk };
};

const signToken = (privateKey: ReturnType<typeof createKey>["privateKey"], kid: string) => {
    const payload = { iss: ISSUER, sub: "user-1" };
    return jwt.sign(payload, privateKey, { algorithm: "RS256", keyid: kid });
};

const createProvider = (cache: JwkCache.Interface) => {
    const container = new Container();
    container.registerInstance(JwkCache, cache);
    container.registerInstance(OidcIdentityProvider, {
        issuer: ISSUER,
        isApplicable: payload => payload.iss === ISSUER,
        getIdentity: async payload => {
            return { id: String(payload.sub), displayName: "User", type: "admin" };
        }
    });
    container.register(OidcJwtIdentityProvider);
    return container.resolve(JwtIdentityProvider);
};

describe("OidcJwtIdentityProvider key rotation", () => {
    it("fetches the keys again when a token is signed with a key it doesn't have", async () => {
        const oldKey = createKey("old-key");
        const newKey = createKey("new-key");
        const cache: JwkCache.Interface = {
            getKeys: vi.fn(async () => [oldKey.jwk]),
            refreshKeys: vi.fn(async () => [oldKey.jwk, newKey.jwk])
        };
        const provider = createProvider(cache);

        const token = signToken(newKey.privateKey, "new-key");
        const decoded = jwt.decode(token, { complete: true })!;
        const identity = await provider.getIdentity(token, {
            header: decoded.header,
            payload: decoded.payload as jwt.JwtPayload
        });

        expect(identity).toMatchObject({ id: "user-1" });
        expect(cache.refreshKeys).toHaveBeenCalledWith(ISSUER);
    });

    it("rejects the token when refreshing doesn't find the key either", async () => {
        const oldKey = createKey("old-key");
        const unknownKey = createKey("unknown-key");
        const cache: JwkCache.Interface = {
            getKeys: vi.fn(async () => [oldKey.jwk]),
            refreshKeys: vi.fn(async () => null)
        };
        const provider = createProvider(cache);

        const token = signToken(unknownKey.privateKey, "unknown-key");
        const decoded = jwt.decode(token, { complete: true })!;
        const identity = await provider.getIdentity(token, {
            header: decoded.header,
            payload: decoded.payload as jwt.JwtPayload
        });

        expect(identity).toBeNull();
    });
});

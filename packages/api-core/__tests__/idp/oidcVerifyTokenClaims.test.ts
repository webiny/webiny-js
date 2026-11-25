import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import { Container } from "@webiny/di";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { JwkCache } from "~/idp/abstractions.js";
import { JwtIdentityProvider } from "~/idp/abstractions.js";
import { OidcIdentityProvider } from "~/idp/abstractions.js";
import { OidcJwtIdentityProvider } from "~/idp/OidcJwtIdentityProvider.js";
import { InvalidAudienceError } from "~/features/security/authentication/AuthenticationContext/errors.js";
import { InvalidTokenError } from "~/features/security/authentication/AuthenticationContext/errors.js";

const ISSUER = "https://idp.example.com/realm";
const KID = "key-1";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const JWK = { ...publicKey.export({ format: "jwk" }), kid: KID, alg: "RS256", use: "sig" };

const getIdentity = (verifyTokenClaims: OidcIdentityProvider.Interface["verifyTokenClaims"]) => {
    const container = new Container();
    container.registerInstance(JwkCache, {
        getKeys: async () => [JWK],
        refreshKeys: async () => null
    });
    container.registerInstance(OidcIdentityProvider, {
        issuer: ISSUER,
        isApplicable: payload => payload.iss === ISSUER,
        getIdentity: async payload => {
            return { id: String(payload.sub), displayName: "User", type: "admin" };
        },
        verifyTokenClaims
    });
    container.register(OidcJwtIdentityProvider);
    const provider = container.resolve(JwtIdentityProvider);

    const token = jwt.sign({ iss: ISSUER, sub: "user-1" }, privateKey, {
        algorithm: "RS256",
        keyid: KID
    });
    const decoded = jwt.decode(token, { complete: true })!;
    const payload = decoded.payload as jwt.JwtPayload;

    return provider.getIdentity(token, { header: decoded.header, payload });
};

describe("OidcJwtIdentityProvider verifyTokenClaims", () => {
    it("turns a plain error thrown to reject the token into an InvalidTokenError", async () => {
        const result = getIdentity(async () => {
            throw new Error("The token's audience is not this API.");
        });

        await expect(result).rejects.toBeInstanceOf(InvalidTokenError);
        await expect(result).rejects.toThrow("The token's audience is not this API.");
    });

    it("keeps an authentication error the provider throws as it is", async () => {
        const result = getIdentity(async () => {
            throw new InvalidAudienceError("Expected the audience https://api.example.com.");
        });

        await expect(result).rejects.toBeInstanceOf(InvalidAudienceError);
    });

    it("returns the identity when the claims are accepted", async () => {
        const identity = await getIdentity(async () => {});

        expect(identity).toMatchObject({ id: "user-1" });
    });
});

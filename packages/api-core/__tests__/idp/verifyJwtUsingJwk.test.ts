import { beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { exportJWK, exportPKCS8, generateKeyPair, type JWK } from "jose";
import {
    isConfiguredJwtOption,
    verifyJwtUsingJwk
} from "~/features/security/utils/verifyJwtUsingJwk.js";

const ISSUER = "https://tenant.auth0.com/";
const CLIENT_ID = "my-client-id";

describe("verifyJwtUsingJwk", () => {
    let privateKeyPem: string;
    let publicJwk: JWK;

    beforeAll(async () => {
        const { privateKey, publicKey } = await generateKeyPair("RS256", { extractable: true });
        privateKeyPem = await exportPKCS8(privateKey);
        publicJwk = { ...(await exportJWK(publicKey)), kid: "key-1", alg: "RS256" };
    });

    const sign = (payload: Record<string, unknown>, options: jwt.SignOptions = {}) => {
        return jwt.sign(payload, privateKeyPem, {
            algorithm: "RS256",
            expiresIn: 60,
            ...options
        });
    };

    it("accepts a token with matching issuer and audience", async () => {
        const token = sign({ sub: "user-1", iss: ISSUER, aud: CLIENT_ID });

        const payload = await verifyJwtUsingJwk(token, publicJwk, {
            issuer: ISSUER,
            audience: CLIENT_ID
        });

        expect(payload.sub).toBe("user-1");
    });

    it("compares issuers ignoring the trailing slash", async () => {
        const token = sign({ sub: "user-1", iss: "https://tenant.auth0.com/", aud: CLIENT_ID });

        const payload = await verifyJwtUsingJwk(token, publicJwk, {
            issuer: "https://tenant.auth0.com",
            audience: CLIENT_ID
        });

        expect(payload.sub).toBe("user-1");
    });

    it("rejects a token minted for another client", async () => {
        const token = sign({ sub: "user-1", iss: ISSUER, aud: "other-client" });

        await expect(
            verifyJwtUsingJwk(token, publicJwk, { issuer: ISSUER, audience: CLIENT_ID })
        ).rejects.toThrow(/jwt audience invalid/);
    });

    it("rejects a token without an audience when an audience is configured", async () => {
        const token = sign({ sub: "user-1", iss: ISSUER });

        await expect(
            verifyJwtUsingJwk(token, publicJwk, { issuer: ISSUER, audience: CLIENT_ID })
        ).rejects.toThrow(/jwt audience invalid/);
    });

    it("rejects a token from another issuer", async () => {
        const token = sign({ sub: "user-1", iss: "https://evil.auth0.com/", aud: CLIENT_ID });

        await expect(
            verifyJwtUsingJwk(token, publicJwk, { issuer: ISSUER, audience: CLIENT_ID })
        ).rejects.toThrow(/jwt issuer invalid/);
    });

    it("skips audience and issuer checks when they are not configured", async () => {
        const token = sign({ sub: "user-1", iss: "https://anything/", aud: "any-client" });

        // `String(process.env.X)` of a missing variable produces "undefined".
        const payload = await verifyJwtUsingJwk(token, publicJwk, {
            issuer: "undefined",
            audience: "undefined"
        });
        expect(payload.sub).toBe("user-1");

        const payload2 = await verifyJwtUsingJwk(token, publicJwk);
        expect(payload2.sub).toBe("user-1");
    });

    it("rejects a token signed with another algorithm", async () => {
        const token = jwt.sign({ sub: "user-1", iss: ISSUER, aud: CLIENT_ID }, "secret", {
            algorithm: "HS256"
        });

        await expect(
            verifyJwtUsingJwk(token, publicJwk, { issuer: ISSUER, audience: CLIENT_ID })
        ).rejects.toThrow();
    });

    it("rejects an expired token", async () => {
        const token = sign({ sub: "user-1", iss: ISSUER, aud: CLIENT_ID }, { expiresIn: -10 });

        await expect(
            verifyJwtUsingJwk(token, publicJwk, { issuer: ISSUER, audience: CLIENT_ID })
        ).rejects.toThrow(/jwt expired/);
    });

    it("isConfiguredJwtOption treats empty and stringified missing values as not configured", () => {
        expect(isConfiguredJwtOption(undefined)).toBe(false);
        expect(isConfiguredJwtOption(null)).toBe(false);
        expect(isConfiguredJwtOption("")).toBe(false);
        expect(isConfiguredJwtOption("  ")).toBe(false);
        expect(isConfiguredJwtOption("undefined")).toBe(false);
        expect(isConfiguredJwtOption("null")).toBe(false);
        expect(isConfiguredJwtOption("abc")).toBe(true);
    });
});

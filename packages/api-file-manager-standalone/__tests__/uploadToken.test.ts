import { describe, it, expect } from "vitest";
import { createUploadToken, verifyUploadToken } from "~/utils/uploadToken.js";
import type { UploadTokenPayload } from "~/types.js";

const SECRET = "test-secret-key-for-hmac";

const makePayload = (overrides: Partial<UploadTokenPayload> = {}): UploadTokenPayload => ({
    key: "tenants/t1/files/abc123/image.jpg",
    tenantId: "t1",
    expiresAt: Date.now() + 60_000,
    uploadMinFileSize: 0,
    uploadMaxFileSize: 1_099_511_627_776,
    ...overrides
});

describe("uploadToken", () => {
    it("should create and verify a valid token", () => {
        const payload = makePayload();
        const token = createUploadToken(payload, SECRET);
        const result = verifyUploadToken(token, SECRET);
        expect(result.key).toEqual(payload.key);
        expect(result.tenantId).toEqual(payload.tenantId);
    });

    it("should reject a token with wrong secret", () => {
        const token = createUploadToken(makePayload(), SECRET);
        expect(() => verifyUploadToken(token, "wrong")).toThrow("Invalid token signature.");
    });

    it("should reject a tampered token", () => {
        const token = createUploadToken(makePayload(), SECRET);
        expect(() => verifyUploadToken(token + "x", SECRET)).toThrow("Invalid token signature.");
    });

    it("should reject an expired token", () => {
        const token = createUploadToken(makePayload({ expiresAt: Date.now() - 1000 }), SECRET);
        expect(() => verifyUploadToken(token, SECRET)).toThrow("Token has expired.");
    });

    it("should reject a token with no dot separator", () => {
        expect(() => verifyUploadToken("nodothere", SECRET)).toThrow("Invalid token format.");
    });
});

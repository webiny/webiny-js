import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
    CLI_RESET_AUDIENCE,
    CLI_RESET_ISSUER,
    signCliResetToken,
    verifyCliResetToken
} from "~/shared/cliResetToken.js";
import { SELF_HOSTED_ISSUER } from "~/api/domain/crypto/TokenIssuer.js";

const SECRET = "test-signing-secret";
const EMAIL = "admin@example.com";

describe("CLI reset token", () => {
    it("round-trips the target email", () => {
        const token = signCliResetToken({ secret: SECRET, email: EMAIL });

        expect(verifyCliResetToken({ secret: SECRET, token })).toEqual({ email: EMAIL });
    });

    it("carries no subject claim, so it cannot name an identity", () => {
        const token = signCliResetToken({ secret: SECRET, email: EMAIL });
        const decoded = jwt.decode(token) as jwt.JwtPayload;

        expect(decoded.sub).toBeUndefined();
        expect(decoded.iss).toBe(CLI_RESET_ISSUER);
        expect(decoded.aud).toBe(CLI_RESET_AUDIENCE);
    });

    it("rejects a token signed with a different secret", () => {
        const token = signCliResetToken({ secret: "some-other-secret", email: EMAIL });

        expect(verifyCliResetToken({ secret: SECRET, token })).toBeNull();
    });

    it("rejects an expired token", () => {
        const token = jwt.sign({ email: EMAIL }, SECRET, {
            algorithm: "HS256",
            issuer: CLI_RESET_ISSUER,
            audience: CLI_RESET_AUDIENCE,
            expiresIn: -10
        });

        expect(verifyCliResetToken({ secret: SECRET, token })).toBeNull();
    });

    /**
     * The reason the two token kinds share a secret but not an issuer. A login token must not be
     * replayable as a reset authorization, or anyone with a session could reset any password.
     */
    it("rejects a login token", () => {
        const loginToken = jwt.sign({ email: EMAIL }, SECRET, {
            algorithm: "HS256",
            issuer: SELF_HOSTED_ISSUER,
            subject: "user-123",
            expiresIn: 3600
        });

        expect(verifyCliResetToken({ secret: SECRET, token: loginToken })).toBeNull();
    });

    it("rejects a correctly issued token that smuggles in a subject", () => {
        const token = jwt.sign({ email: EMAIL }, SECRET, {
            algorithm: "HS256",
            issuer: CLI_RESET_ISSUER,
            audience: CLI_RESET_AUDIENCE,
            subject: "user-123",
            expiresIn: 120
        });

        expect(verifyCliResetToken({ secret: SECRET, token })).toBeNull();
    });

    it("rejects a token minted for a different audience", () => {
        const token = jwt.sign({ email: EMAIL }, SECRET, {
            algorithm: "HS256",
            issuer: CLI_RESET_ISSUER,
            audience: "some-other-audience",
            expiresIn: 120
        });

        expect(verifyCliResetToken({ secret: SECRET, token })).toBeNull();
    });

    it("rejects a token with no email to act on", () => {
        const token = jwt.sign({}, SECRET, {
            algorithm: "HS256",
            issuer: CLI_RESET_ISSUER,
            audience: CLI_RESET_AUDIENCE,
            expiresIn: 120
        });

        expect(verifyCliResetToken({ secret: SECRET, token })).toBeNull();
    });

    it("rejects an unsigned token", () => {
        const token = jwt.sign({ email: EMAIL }, SECRET, {
            algorithm: "none",
            issuer: CLI_RESET_ISSUER,
            audience: CLI_RESET_AUDIENCE
        } as jwt.SignOptions);

        expect(verifyCliResetToken({ secret: SECRET, token })).toBeNull();
    });
});

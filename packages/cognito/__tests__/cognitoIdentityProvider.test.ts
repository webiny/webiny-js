import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { CognitoIdentityProvider } from "~/api/features/CognitoIdp/CognitoIdentityProvider.js";
import { CognitoIdpConfig } from "~/api/features/CognitoIdp/abstractions.js";

const createIdToken = (claims: Record<string, unknown> = {}) => {
    return {
        token_use: "id",
        sub: "cognito-sub-1",
        ...claims
    };
};

const googleIdentity = (userId: string) => {
    return {
        userId,
        providerName: "Google",
        providerType: "Google",
        issuer: null,
        primary: "true",
        dateCreated: "1700000000000"
    };
};

const createProvider = (config?: CognitoIdpConfig.Interface) => {
    const container = new Container();
    if (config) {
        container.registerInstance(CognitoIdpConfig, config);
    }
    return container.resolveImplementation(CognitoIdentityProvider);
};

describe("CognitoIdentityProvider - federated custom:id", () => {
    let provider: ReturnType<typeof createProvider>;

    beforeEach(() => {
        provider = createProvider();
    });

    it("should accept a federated token whose custom:id matches the identity user ID", async () => {
        const token = createIdToken({
            "custom:id": "google-123",
            identities: [googleIdentity("google-123")]
        });

        await expect(provider.verifyTokenClaims!(token)).resolves.toBeUndefined();
    });

    it("should accept a match against any of the token identities", async () => {
        const token = createIdToken({
            "custom:id": "google-456",
            identities: [googleIdentity("google-123"), googleIdentity("google-456")]
        });

        await expect(provider.verifyTokenClaims!(token)).resolves.toBeUndefined();
    });

    it("should compare numeric identity user IDs as strings", async () => {
        const token = createIdToken({
            "custom:id": "1234567890",
            identities: [{ ...googleIdentity("x"), userId: 1234567890 }]
        });

        await expect(provider.verifyTokenClaims!(token)).resolves.toBeUndefined();
    });

    it("should accept identities given as a JSON string", async () => {
        const token = createIdToken({
            "custom:id": "google-123",
            identities: JSON.stringify([googleIdentity("google-123")])
        });

        await expect(provider.verifyTokenClaims!(token)).resolves.toBeUndefined();
    });

    it("should reject a federated token whose custom:id doesn't match", async () => {
        const token = createIdToken({
            "custom:id": "victim-user-id",
            identities: [googleIdentity("google-123")]
        });

        await expect(provider.verifyTokenClaims!(token)).rejects.toThrow(
            `Invalid token: "custom:id" must match the user ID of the federated identity.`
        );
    });

    it("should reject a federated token without custom:id", async () => {
        const token = createIdToken({
            identities: [googleIdentity("google-123")]
        });

        await expect(provider.verifyTokenClaims!(token)).rejects.toThrow(
            `Invalid token: "custom:id" must match the user ID of the federated identity.`
        );
    });

    it("should reject a token with a malformed identities claim", async () => {
        const token = createIdToken({
            "custom:id": "google-123",
            identities: { userId: "google-123" }
        });

        await expect(provider.verifyTokenClaims!(token)).rejects.toThrow(
            `Invalid token: "identities" claim is malformed.`
        );
    });

    it("should not change verification of native (non-federated) tokens", async () => {
        await expect(
            provider.verifyTokenClaims!(createIdToken({ "custom:id": "webiny-user-id" }))
        ).resolves.toBeUndefined();
        await expect(provider.verifyTokenClaims!(createIdToken())).resolves.toBeUndefined();
        await expect(
            provider.verifyTokenClaims!(createIdToken({ "custom:id": "x", identities: [] }))
        ).resolves.toBeUndefined();
    });

    it("should still reject non-ID tokens", async () => {
        await expect(
            provider.verifyTokenClaims!(createIdToken({ token_use: "access" }))
        ).rejects.toThrow(`Invalid token: "token_use" must be "id".`);
    });

    it("should skip the check when the project opts out, and still call its own verifyTokenClaims", async () => {
        const verified: unknown[] = [];
        const optedOut = createProvider({
            verifyFederatedCustomId: false,
            getIdentity: () => ({ id: "x", displayName: "x" }) as CognitoIdpConfig.IdentityData,
            verifyTokenClaims: token => {
                verified.push(token["custom:id"]);
            }
        });

        const token = createIdToken({
            "custom:id": "user@example.com",
            identities: [googleIdentity("google-123")]
        });

        await expect(optedOut.verifyTokenClaims!(token)).resolves.toBeUndefined();
        expect(verified).toEqual(["user@example.com"]);
    });

    it("should keep the check when a project config doesn't opt out", async () => {
        const withConfig = createProvider({
            getIdentity: () => ({ id: "x", displayName: "x" }) as CognitoIdpConfig.IdentityData
        });

        const token = createIdToken({
            "custom:id": "victim-user-id",
            identities: [googleIdentity("google-123")]
        });

        await expect(withConfig.verifyTokenClaims!(token)).rejects.toThrow(
            `Invalid token: "custom:id" must match the user ID of the federated identity.`
        );
    });
});

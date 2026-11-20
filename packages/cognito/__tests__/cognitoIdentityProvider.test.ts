import { describe, it, expect } from "vitest";
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

const createProvider = (config?: CognitoIdpConfig.Interface) => {
    const container = new Container();
    if (config) {
        container.registerInstance(CognitoIdpConfig, config);
    }
    return container.resolveImplementation(CognitoIdentityProvider);
};

describe("CognitoIdentityProvider - token claims", () => {
    it("should accept ID tokens", async () => {
        const provider = createProvider();

        await expect(provider.verifyTokenClaims!(createIdToken())).resolves.toBeUndefined();
    });

    it("should reject access tokens and tokens without token_use", async () => {
        const provider = createProvider();

        await expect(
            provider.verifyTokenClaims!(createIdToken({ token_use: "access" }))
        ).rejects.toThrow(`Invalid token: "token_use" must be "id".`);
        await expect(
            provider.verifyTokenClaims!(createIdToken({ token_use: undefined }))
        ).rejects.toThrow(`Invalid token: "token_use" must be "id".`);
    });

    it("should still call the project's own verifyTokenClaims for ID tokens", async () => {
        const verified: unknown[] = [];
        const provider = createProvider({
            getIdentity: () => ({ id: "x", displayName: "x" }) as CognitoIdpConfig.IdentityData,
            verifyTokenClaims: token => {
                verified.push(token.sub);
            }
        });

        await expect(provider.verifyTokenClaims!(createIdToken())).resolves.toBeUndefined();
        expect(verified).toEqual(["cognito-sub-1"]);
    });
});

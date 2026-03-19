import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export const createMockGetIdentity = (identity?: Partial<IdentityData>) => {
    return (): IdentityData => {
        return {
            id: "mock-identity-id",
            type: "admin",
            displayName: "Mock Identity",
            ...identity
        };
    };
};

import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export const getIdentity = (): IdentityData => {
    return {
        id: "mocked-identity-id",
        displayName: "mocked-identity-display-name",
        type: "mocked-identity-type"
    };
};

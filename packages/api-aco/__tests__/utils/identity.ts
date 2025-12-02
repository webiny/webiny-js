import {
    AuthenticatedIdentity,
    type IdentityData
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export const createIdentity = (identity: Partial<IdentityData> = {}): SecurityIdentity => {
    return new AuthenticatedIdentity({
        id: "12345678",
        type: "admin",
        displayName: "John Doe",
        ...identity
    });
};

import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const defaultIdentity = {
    id: "id-12345678",
    displayName: "John Doe",
    type: "admin"
};

export const getSecurityIdentity = () => {
    return { ...defaultIdentity };
};

export const createIdentity = (identity?: IdentityData) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return { ...identity };
};

import { SecurityIdentity } from "@webiny/api-security/types";

const defaultIdentity = {
    id: "id-12345678",
    displayName: "John Doe",
    type: "admin"
};

export const getSecurityIdentity = () => {
    return { ...defaultIdentity };
};

export const createIdentity = (identity?: SecurityIdentity) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return { ...identity };
};

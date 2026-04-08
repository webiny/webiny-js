import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface PermissionsArg {
    name: string;
    rwd?: string;
    pw?: string;
    own?: boolean;
}

export const identity = {
    id: "id-12345678",
    displayName: "John Doe",
    type: "admin"
};

const getSecurityIdentity = () => {
    return identity;
};

export const createPermissions = (permissions?: PermissionsArg[]): PermissionsArg[] => {
    if (permissions) {
        return permissions;
    }
    return [
        {
            name: "*"
        }
    ];
};

export const createIdentity = (identity?: IdentityData) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return identity;
};

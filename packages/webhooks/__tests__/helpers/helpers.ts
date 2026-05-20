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

export const createPermissions = (permissions?: PermissionsArg[]): PermissionsArg[] => {
    if (permissions) {
        return permissions;
    }
    return [
        {
            name: "webhooks.webhook",
            rwd: "rwd"
        },
        {
            name: "*"
        }
    ];
};

export const createIdentity = (overrides?: IdentityData) => {
    if (overrides) {
        return overrides;
    }
    return identity;
};

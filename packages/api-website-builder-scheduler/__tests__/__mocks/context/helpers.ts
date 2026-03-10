import type { IdentityData } from "@webiny/api-core/features/IdentityContext";

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
            name: "wb.page",
            rwd: "rwd",
            pw: "rpu"
        },
        {
            name: "content.i18n"
        }
    ];
};

export const createIdentity = (identityData?: IdentityData) => {
    if (!identityData) {
        return getSecurityIdentity();
    }
    return identityData;
};

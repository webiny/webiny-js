import { SecurityIdentity } from "@webiny/api-security/types";
import { GenericRecord } from "@webiny/api/types";

export interface Permission {
    name: string;
    locales?: string[];
    models?: GenericRecord<string>;
    groups?: GenericRecord<string>;
    rwd?: string;
    pw?: string;
    own?: boolean;
    _src?: string;
}

export const identity = {
    id: "id-12345678",
    displayName: "John Doe",
    type: "admin"
};

const getSecurityIdentity = () => {
    return identity;
};

export const createPermissions = (permissions?: Permission[]): Permission[] => {
    if (permissions) {
        return permissions;
    }
    return [
        {
            name: "*"
        }
    ];
};

export const createIdentity = (identity?: SecurityIdentity) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return identity;
};

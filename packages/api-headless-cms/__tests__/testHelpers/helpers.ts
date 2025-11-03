import { ContextPlugin } from "@webiny/api";
import { IdentityData } from "@webiny/api-core/features/IdentityContext";
import type { CmsContext } from "~/types";

export interface PermissionsArg {
    name: string;
    locales?: string[];
    models?: Record<string, any>;
    groups?: Record<string, any>;
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

export const createPermissions = (permissions?: PermissionsArg[]): PermissionsArg[] => {
    if (permissions) {
        return permissions;
    }
    return [
        {
            name: "cms.settings"
        },
        {
            name: "cms.contentModel",
            rwd: "rwd"
        },
        {
            name: "cms.contentModelGroup",
            rwd: "rwd"
        },
        {
            name: "cms.contentEntry",
            rwd: "rwd",
            pw: "rcpu"
        },
        {
            name: "cms.endpoint.read"
        },
        {
            name: "cms.endpoint.manage"
        },
        {
            name: "cms.endpoint.preview"
        },
        {
            name: "content.i18n",
            locales: ["en-US", "de-DE"]
        }
    ];
};

export const createIdentity = (identity?: IdentityData) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return identity;
};

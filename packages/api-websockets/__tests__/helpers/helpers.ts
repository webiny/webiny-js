import { ContextPlugin } from "@webiny/api";
import type { Context } from "~tests/types";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export interface PermissionsArg {
    name: string;
    locales?: string[];
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
            name: "task.entry",
            rwd: "rwd"
        },
        {
            name: "content.i18n",
            locales: ["en-US", "de-DE"]
        },
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

export const createDummyLocales = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        const { security } = context;

        await security.authenticate("");
    });

    plugin.name = "testing.use-dummy-locales";

    return plugin;
};

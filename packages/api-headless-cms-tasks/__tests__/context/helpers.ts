import { SecurityIdentity } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { HeadlessCmsTasksContext } from "~/types";

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

export const createIdentity = (identity?: SecurityIdentity) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return identity;
};

export const createDummyLocales = () => {
    return new ContextPlugin<HeadlessCmsTasksContext>(async context => {
        const { i18n, security } = context;

        await security.authenticate("");

        await security.withoutAuthorization(async () => {
            const [items] = await i18n.locales.listLocales({
                where: {}
            });
            if (items.length > 0) {
                return;
            }
            await i18n.locales.createLocale({
                code: "en-US",
                default: true
            });
            await i18n.locales.createLocale({
                code: "de-DE",
                default: true
            });
        });
    });
};

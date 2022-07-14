import { SecurityIdentity } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/handler";
import { TestContext } from "./types";
export { until } from "@webiny/project-utils/testing/helpers/until";
export { sleep } from "@webiny/project-utils/testing/helpers/sleep";

export interface PermissionsArg {
    name: string;
    locales?: string[];
    rwd?: string;
    pw?: string;
    own?: boolean;
}

export const identity = {
    id: "12345678",
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

export const createIdentity = (identity?: SecurityIdentity) => {
    if (!identity) {
        return getSecurityIdentity();
    }
    return identity;
};

export const createDummyPathContextPlugin = (path?: string): ContextPlugin<TestContext> => {
    return new ContextPlugin<TestContext>(async context => {
        if (!path) {
            return;
        }
        context.http = {
            ...(context?.http || {}),
            request: {
                ...(context?.http?.request || {}),
                path: {
                    ...(context?.http?.request?.path || {}),
                    parameters: {
                        ...(context?.http?.request?.path?.parameters || {}),
                        key: path
                    }
                }
            }
        };
    });
};

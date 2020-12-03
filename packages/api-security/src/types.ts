import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";

export type SecurityIdentity = {
    id: string;
    displayName: string;
    type: string;
    [key: string]: any;
};

export type SecurityAuthenticationPlugin = Plugin & {
    type: "security-authentication";
    authenticate(context: Context): Promise<null> | Promise<SecurityIdentity>;
};

export type SecurityPermission<T = Record<string, any>> = T & {
    name: string;
};

export type SecurityAuthorizationPlugin = Plugin & {
    type: "security-authorization";
    getPermissions(context: Context): Promise<SecurityPermission[]>;
};

export type SecurityContext = {
    security: {
        getIdentity: () => SecurityIdentity;
        getPermission: (name: string) => Promise<SecurityPermission>;
    };
};

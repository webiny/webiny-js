import { Plugin } from "@webiny/plugins/types";
import { HandlerContext } from "@webiny/handler/types";
export type SecurityIdentity = {
    id: string;
    login: string;
    type: string;
    [key: string]: any;
};

export type SecurityAuthenticationPlugin = Plugin & {
    type: "security-authentication";
    authenticate(context: any): Promise<null> | Promise<SecurityIdentity>;
};

export type SecurityPermission = {
    name: string;
    [key: string]: any;
};

export type SecurityAuthorizationPlugin = Plugin & {
    type: "security-authorization";
    getPermissions(context: HandlerContext): Promise<SecurityPermission[]>;
};

export type SecurityContext = {
    security: {
        getIdentity: () => SecurityIdentity;
        getPermission: (name: string) => Promise<SecurityPermission>;
    };
};
